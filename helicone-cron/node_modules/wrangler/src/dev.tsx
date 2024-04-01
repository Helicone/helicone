import path from "node:path";
import chalk from "chalk";
import { watch } from "chokidar";
import getPort from "get-port";
import { render } from "ink";
import React from "react";
import { findWranglerToml, printBindings, readConfig } from "./config";
import Dev from "./dev/dev";
import { getVarsForDev } from "./dev/dev-vars";
import { getLocalPersistencePath } from "./dev/get-local-persistence-path";

import { startDevServer } from "./dev/start-server";
import { getEntry } from "./entry";
import { logger } from "./logger";
import * as metrics from "./metrics";
import { getAssetPaths, getSiteAssetPaths } from "./sites";
import { getAccountFromCache } from "./user";
import { collectKeyValues } from "./utils/collectKeyValues";
import { identifyD1BindingsAsBeta } from "./worker";
import { getHostFromRoute, getZoneForRoute, getZoneIdFromHost } from "./zones";
import {
	type ConfigPath,
	DEFAULT_INSPECTOR_PORT,
	DEFAULT_LOCAL_PORT,
	getDevCompatibilityDate,
	getRules,
	getScriptName,
	isLegacyEnv,
	printWranglerBanner,
} from "./index";
import type { Config, Environment } from "./config";
import type { Route } from "./config/environment";
import type { EnablePagesAssetsServiceBindingOptions } from "./miniflare-cli";
import type { CfWorkerInit } from "./worker";
import type { CommonYargsOptions } from "./yargs-types";
import type { Argv, ArgumentsCamelCase } from "yargs";

interface DevArgs {
	config?: string;
	script?: string;
	name?: string;
	bundle?: boolean;
	build?: boolean;
	format?: string;
	env?: string;
	"compatibility-date"?: string;
	"compatibility-flags"?: string[];
	latest?: boolean;
	ip?: string;
	inspect?: boolean;
	port?: number;
	"inspector-port"?: number;
	routes?: string[];
	host?: string;
	"local-protocol"?: "http" | "https";
	"local-upstream"?: string | undefined;
	"experimental-public"?: string;
	public?: string;
	assets?: string;
	site?: string;
	"site-include"?: string[];
	"site-exclude"?: string[];
	"upstream-protocol"?: "http" | "https";
	"jsx-factory"?: string;
	"jsx-fragment"?: string;
	tsconfig?: string;
	local?: boolean;
	"experimental-local"?: boolean;
	"experimental-local-remote-kv"?: boolean;
	minify?: boolean;
	var?: string[];
	define?: string[];
	"node-compat"?: boolean;
	"experimental-enable-local-persistence"?: boolean;
	persist?: boolean;
	"persist-to"?: string;
	"live-reload"?: boolean;
	onReady?: (ip: string, port: number) => void;
	logLevel?: "none" | "info" | "error" | "log" | "warn" | "debug";
	logPrefix?: string;
	showInteractiveDevSession?: boolean;
	"test-scheduled"?: boolean;
}

export function devOptions(yargs: Argv<CommonYargsOptions>): Argv<DevArgs> {
	return (
		yargs
			.positional("script", {
				describe: "The path to an entry point for your worker",
				type: "string",
			})
			.option("name", {
				describe: "Name of the worker",
				type: "string",
				requiresArg: true,
			})
			// We want to have a --no-bundle flag, but yargs requires that
			// we also have a --bundle flag (that it adds the --no to by itself)
			// So we make a --bundle flag, but hide it, and then add a --no-bundle flag
			// that's visible to the user but doesn't "do" anything.
			.option("bundle", {
				describe: "Run wrangler's compilation step before publishing",
				type: "boolean",
				hidden: true,
			})
			.option("no-bundle", {
				describe: "Skip internal build steps and directly publish script",
				type: "boolean",
				default: false,
			})
			.option("format", {
				choices: ["modules", "service-worker"] as const,
				describe: "Choose an entry type",
				hidden: true,
				deprecated: true,
			})
			.option("compatibility-date", {
				describe: "Date to use for compatibility checks",
				type: "string",
				requiresArg: true,
			})
			.option("compatibility-flags", {
				describe: "Flags to use for compatibility checks",
				alias: "compatibility-flag",
				type: "string",
				requiresArg: true,
				array: true,
			})
			.option("latest", {
				describe: "Use the latest version of the worker runtime",
				type: "boolean",
				default: true,
			})
			.option("ip", {
				describe: "IP address to listen on",
				type: "string",
			})
			.option("port", {
				describe: "Port to listen on",
				type: "number",
			})
			.option("inspector-port", {
				describe: "Port for devtools to connect to",
				type: "number",
			})
			.option("routes", {
				describe: "Routes to upload",
				alias: "route",
				type: "string",
				requiresArg: true,
				array: true,
			})
			.option("host", {
				type: "string",
				requiresArg: true,
				describe:
					"Host to forward requests to, defaults to the zone of project",
			})
			.option("local-protocol", {
				describe: "Protocol to listen to requests on, defaults to http.",
				choices: ["http", "https"] as const,
			})
			.options("local-upstream", {
				type: "string",
				describe:
					"Host to act as origin in local mode, defaults to dev.host or route",
			})
			.option("experimental-public", {
				describe: "Static assets to be served",
				type: "string",
				requiresArg: true,
				deprecated: true,
				hidden: true,
			})
			.option("assets", {
				describe: "Static assets to be served",
				type: "string",
				requiresArg: true,
			})
			.option("site", {
				describe: "Root folder of static assets for Workers Sites",
				type: "string",
				requiresArg: true,
			})
			.option("site-include", {
				describe:
					"Array of .gitignore-style patterns that match file or directory names from the sites directory. Only matched items will be uploaded.",
				type: "string",
				requiresArg: true,
				array: true,
			})
			.option("site-exclude", {
				describe:
					"Array of .gitignore-style patterns that match file or directory names from the sites directory. Matched items will not be uploaded.",
				type: "string",
				requiresArg: true,
				array: true,
			})
			.option("upstream-protocol", {
				describe: "Protocol to forward requests to host on, defaults to https.",
				choices: ["http", "https"] as const,
			})
			.option("var", {
				describe:
					"A key-value pair to be injected into the script as a variable",
				type: "string",
				requiresArg: true,
				array: true,
			})
			.option("define", {
				describe: "A key-value pair to be substituted in the script",
				type: "string",
				requiresArg: true,
				array: true,
			})
			.option("jsx-factory", {
				describe: "The function that is called for each JSX element",
				type: "string",
				requiresArg: true,
			})
			.option("jsx-fragment", {
				describe: "The function that is called for each JSX fragment",
				type: "string",
				requiresArg: true,
			})
			.option("tsconfig", {
				describe: "Path to a custom tsconfig.json file",
				type: "string",
				requiresArg: true,
			})
			.option("local", {
				alias: "l",
				describe: "Run on my machine",
				type: "boolean",
				default: false, // I bet this will a point of contention. We'll revisit it.
			})
			.option("experimental-local", {
				describe: "Run on my machine using the Cloudflare Workers runtime",
				type: "boolean",
				default: false,
			})
			.option("experimental-local-remote-kv", {
				describe:
					"Read/write KV data from/to real namespaces on the Cloudflare network",
				type: "boolean",
				default: false,
			})
			.check((argv) => {
				if (argv.local && argv["experimental-local"]) {
					throw new Error(
						"--local and --experimental-local are mutually exclusive. " +
							"Please enable one or the other."
					);
				}
				if (
					argv["experimental-local-remote-kv"] &&
					!argv["experimental-local"]
				) {
					throw new Error(
						"--experimental-local-remote-kv requires --experimental-local to be enabled."
					);
				}
				return true;
			})
			.option("minify", {
				describe: "Minify the script",
				type: "boolean",
			})
			.option("node-compat", {
				describe: "Enable node.js compatibility",
				type: "boolean",
			})
			.option("experimental-enable-local-persistence", {
				describe:
					"Enable persistence for local mode (deprecated, use --persist)",
				type: "boolean",
				deprecated: true,
				hidden: true,
			})
			.option("persist", {
				describe:
					"Enable persistence for local mode, using default path: .wrangler/state",
				type: "boolean",
			})
			.option("persist-to", {
				describe:
					"Specify directory to use for local persistence (implies --persist)",
				type: "string",
				requiresArg: true,
			})
			.option("live-reload", {
				describe:
					"Auto reload HTML pages when change is detected in local mode",
				type: "boolean",
			})
			.check((argv) => {
				const local = argv["local"] || argv["experimental-local"];
				if (argv["live-reload"] && !local) {
					throw new Error(
						"--live-reload is only supported in local mode. " +
							"Please enable either --local or --experimental-local."
					);
				}
				return true;
			})
			.option("inspect", {
				describe: "Enable dev tools",
				type: "boolean",
				deprecated: true,
				hidden: true,
			})
			.option("legacy-env", {
				type: "boolean",
				describe: "Use legacy environments",
				hidden: true,
			})
			.option("test-scheduled", {
				describe: "Test scheduled events by visiting /__scheduled in browser",
				type: "boolean",
				default: false,
			})
			.option("log-level", {
				choices: ["debug", "info", "log", "warn", "error", "none"] as const,
				describe: "Specify logging level",
				default: "log",
			})
	);
}

export async function devHandler(args: ArgumentsCamelCase<DevArgs>) {
	let watcher;
	try {
		const devInstance = await startDev(args);
		watcher = devInstance.watcher;
		const { waitUntilExit } = devInstance.devReactElement;
		await waitUntilExit();
	} finally {
		await watcher?.close();
	}
}

export type AdditionalDevProps = {
	vars?: {
		[key: string]: unknown;
	};
	kv?: {
		binding: string;
		id: string;
		preview_id?: string;
	}[];
	durableObjects?: {
		name: string;
		class_name: string;
		script_name?: string | undefined;
		environment?: string | undefined;
	}[];
	r2?: {
		binding: string;
		bucket_name: string;
		preview_bucket_name?: string;
	}[];
	d1Databases?: Environment["d1_databases"];
};

type StartDevOptions = ArgumentsCamelCase<DevArgs> &
	// These options can be passed in directly when called with the `wrangler.dev()` API.
	// They aren't exposed as CLI arguments.
	AdditionalDevProps & {
		forceLocal?: boolean;
		enablePagesAssetsServiceBinding?: EnablePagesAssetsServiceBindingOptions;
	};

export async function startDev(args: StartDevOptions) {
	let watcher: ReturnType<typeof watch> | undefined;
	let rerender: (node: React.ReactNode) => void | undefined;
	try {
		if (args.logLevel) {
			logger.loggerLevel = args.logLevel;
		}
		await printWranglerBanner();

		if (args.local && process.platform !== "win32") {
			logger.info(
				chalk.magenta(
					`Want to try out the next version of local mode using the open-source Workers runtime?\nSwitch out --local for ${chalk.bold(
						"--experimental-local"
					)} and let us know what you think at https://discord.gg/cloudflaredev !`
				)
			);
		}

		const configPath =
			(args.config as ConfigPath) ||
			((args.script &&
				findWranglerToml(path.dirname(args.script))) as ConfigPath);
		let config = readConfig(configPath, args);

		if (config.configPath) {
			watcher = watch(config.configPath, {
				persistent: true,
			}).on("change", async (_event) => {
				// TODO: Do we need to handle different `_event` types differently?
				//       e.g. what if the file is deleted, or added?
				config = readConfig(configPath, args);
				if (config.configPath) {
					logger.log(`${path.basename(config.configPath)} changed...`);
					rerender(await getDevReactElement(config));
				}
			});
		}

		const {
			entry,
			nodeCompat,
			upstreamProtocol,
			zoneId,
			host,
			routes,
			getLocalPort,
			getInspectorPort,
			cliDefines,
			localPersistencePath,
		} = await validateDevServerSettings(args, config);

		await metrics.sendMetricsEvent(
			"run dev",
			{
				local: args.local,
				usesTypeScript: /\.tsx?$/.test(entry.file),
			},
			{ sendMetrics: config.send_metrics, offline: args.local }
		);

		// eslint-disable-next-line no-inner-declarations
		async function getDevReactElement(configParam: Config) {
			const { assetPaths, bindings } = await getBindingsAndAssetPaths(
				args,
				configParam
			);

			return (
				<Dev
					name={getScriptName({ name: args.name, env: args.env }, configParam)}
					noBundle={!(args.bundle ?? !configParam.no_bundle)}
					entry={entry}
					env={args.env}
					zone={zoneId}
					host={host}
					routes={routes}
					rules={getRules(configParam)}
					legacyEnv={isLegacyEnv(configParam)}
					minify={args.minify ?? configParam.minify}
					nodeCompat={nodeCompat}
					build={configParam.build || {}}
					define={{ ...configParam.define, ...cliDefines }}
					initialMode={
						args.local || args.experimentalLocal ? "local" : "remote"
					}
					jsxFactory={args["jsx-factory"] || configParam.jsx_factory}
					jsxFragment={args["jsx-fragment"] || configParam.jsx_fragment}
					tsconfig={args.tsconfig ?? configParam.tsconfig}
					upstreamProtocol={upstreamProtocol}
					localProtocol={args.localProtocol || configParam.dev.local_protocol}
					localUpstream={args["local-upstream"] || host}
					localPersistencePath={localPersistencePath}
					liveReload={args.liveReload || false}
					accountId={configParam.account_id || getAccountFromCache()?.id}
					assetPaths={assetPaths}
					assetsConfig={configParam.assets}
					initialPort={
						args.port ?? configParam.dev.port ?? (await getLocalPort())
					}
					initialIp={args.ip || configParam.dev.ip}
					inspectorPort={
						args.inspectorPort ??
						configParam.dev.inspector_port ??
						(await getInspectorPort())
					}
					isWorkersSite={Boolean(args.site || configParam.site)}
					compatibilityDate={getDevCompatibilityDate(
						configParam,
						args.compatibilityDate
					)}
					compatibilityFlags={
						args.compatibilityFlags || configParam.compatibility_flags
					}
					usageModel={configParam.usage_model}
					bindings={bindings}
					crons={configParam.triggers.crons}
					queueConsumers={configParam.queues.consumers}
					logPrefix={args.logPrefix}
					onReady={args.onReady}
					inspect={args.inspect ?? true}
					showInteractiveDevSession={args.showInteractiveDevSession}
					forceLocal={args.forceLocal}
					enablePagesAssetsServiceBinding={args.enablePagesAssetsServiceBinding}
					firstPartyWorker={configParam.first_party_worker}
					sendMetrics={configParam.send_metrics}
					testScheduled={args["test-scheduled"]}
					experimentalLocal={args.experimentalLocal}
					experimentalLocalRemoteKv={args.experimentalLocalRemoteKv}
				/>
			);
		}
		const devReactElement = render(await getDevReactElement(config));
		rerender = devReactElement.rerender;
		return {
			devReactElement,
			watcher,
			stop: async () => {
				devReactElement.unmount();
				await watcher?.close();
			},
		};
	} finally {
		await watcher?.close();
	}
}

export async function startApiDev(args: StartDevOptions) {
	if (args.logLevel) {
		logger.loggerLevel = args.logLevel;
	}
	await printWranglerBanner();

	const configPath =
		(args.config as ConfigPath) ||
		((args.script &&
			findWranglerToml(path.dirname(args.script))) as ConfigPath);
	const config = readConfig(configPath, args);

	const {
		entry,
		nodeCompat,
		upstreamProtocol,
		zoneId,
		host,
		routes,
		getLocalPort,
		getInspectorPort,
		cliDefines,
		localPersistencePath,
	} = await validateDevServerSettings(args, config);

	await metrics.sendMetricsEvent(
		"run dev (api)",
		{ local: args.local },
		{ sendMetrics: config.send_metrics, offline: args.local }
	);

	// eslint-disable-next-line no-inner-declarations
	async function getDevServer(configParam: Config) {
		const { assetPaths, bindings } = await getBindingsAndAssetPaths(
			args,
			configParam
		);

		//if args.bundle is on, don't disable bundling
		//if there's no args.bundle, and configParam.no_bundle is on, disable bundling
		//otherwise, enable bundling
		const enableBundling = args.bundle ?? !configParam.no_bundle;
		return await startDevServer({
			name: getScriptName({ name: args.name, env: args.env }, configParam),
			noBundle: !enableBundling,
			entry: entry,
			env: args.env,
			zone: zoneId,
			host: host,
			routes: routes,
			rules: getRules(configParam),
			legacyEnv: isLegacyEnv(configParam),
			minify: args.minify ?? configParam.minify,
			nodeCompat: nodeCompat,
			build: configParam.build || {},
			define: { ...config.define, ...cliDefines },
			initialMode: args.local ? "local" : "remote",
			jsxFactory: args["jsx-factory"] || configParam.jsx_factory,
			jsxFragment: args["jsx-fragment"] || configParam.jsx_fragment,
			tsconfig: args.tsconfig ?? configParam.tsconfig,
			upstreamProtocol: upstreamProtocol,
			localProtocol: args.localProtocol || configParam.dev.local_protocol,
			localUpstream: args["local-upstream"] || host,
			localPersistencePath,
			liveReload: args.liveReload || false,
			accountId: configParam.account_id || getAccountFromCache()?.id,
			assetPaths: assetPaths,
			assetsConfig: configParam.assets,
			//port can be 0, which means to use a random port
			initialPort: args.port ?? configParam.dev.port ?? (await getLocalPort()),
			initialIp: args.ip || configParam.dev.ip,
			inspectorPort:
				args["inspector-port"] ??
				configParam.dev.inspector_port ??
				(await getInspectorPort()),
			isWorkersSite: Boolean(args.site || configParam.site),
			compatibilityDate: getDevCompatibilityDate(
				config,
				// Only `compatibilityDate` will be set when using `unstable_dev`
				args["compatibility-date"] ?? args.compatibilityDate
			),
			compatibilityFlags:
				args["compatibility-flags"] ??
				args.compatibilityFlags ??
				configParam.compatibility_flags,
			usageModel: configParam.usage_model,
			bindings: bindings,
			crons: configParam.triggers.crons,
			queueConsumers: configParam.queues.consumers,
			logPrefix: args.logPrefix,
			onReady: args.onReady,
			inspect: args.inspect ?? true,
			showInteractiveDevSession: args.showInteractiveDevSession,
			forceLocal: args.forceLocal,
			enablePagesAssetsServiceBinding: args.enablePagesAssetsServiceBinding,
			local: args.local ?? true,
			firstPartyWorker: configParam.first_party_worker,
			sendMetrics: configParam.send_metrics,
			testScheduled: args.testScheduled,
			experimentalLocal: args.experimentalLocal,
			experimentalLocalRemoteKv: args.experimentalLocalRemoteKv,
		});
	}

	const devServer = await getDevServer(config);
	if (!devServer) {
		throw logger.error("Failed to start dev server.");
	}

	return {
		stop: async () => {
			await devServer.stop();
		},
	};
}
/**
 * Avoiding calling `getPort()` multiple times by memoizing the first result.
 */
function memoizeGetPort(defaultPort: number) {
	let portValue: number;
	return async () => {
		return portValue || (portValue = await getPort({ port: defaultPort }));
	};
}
/**
 * mask anything that was overridden in .dev.vars
 * so that we don't log potential secrets into the terminal
 */
function maskVars(bindings: CfWorkerInit["bindings"], configParam: Config) {
	const maskedVars = { ...bindings.vars };
	for (const key of Object.keys(maskedVars)) {
		if (maskedVars[key] !== configParam.vars[key]) {
			// This means it was overridden in .dev.vars
			// so let's mask it
			maskedVars[key] = "(hidden)";
		}
	}
	return maskedVars;
}

async function getZoneIdHostAndRoutes(args: StartDevOptions, config: Config) {
	// TODO: if worker_dev = false and no routes, then error (only for dev)
	// Compute zone info from the `host` and `route` args and config;
	let host = args.host || config.dev.host;
	let zoneId: string | undefined;
	const routes: Route[] | undefined =
		args.routes || (config.route && [config.route]) || config.routes;

	if (args.forceLocal) {
		args.local = true;
	}

	if (!args.local) {
		if (host) {
			zoneId = await getZoneIdFromHost(host);
		}
		if (!zoneId && routes) {
			const firstRoute = routes[0];
			const zone = await getZoneForRoute(firstRoute);
			if (zone) {
				zoneId = zone.id;
				host = zone.host;
			}
		}
	} else if (!host) {
		if (routes) {
			const firstRoute = routes[0];
			host = getHostFromRoute(firstRoute);
		}
	}
	return { host, routes, zoneId };
}

async function validateDevServerSettings(
	args: StartDevOptions,
	config: Config
) {
	const entry = await getEntry(
		{ assets: args.assets, script: args.script },
		config,
		"dev"
	);

	const { zoneId, host, routes } = await getZoneIdHostAndRoutes(args, config);
	const getLocalPort = memoizeGetPort(DEFAULT_LOCAL_PORT);
	const getInspectorPort = memoizeGetPort(DEFAULT_INSPECTOR_PORT);

	if (config.services && config.services.length > 0) {
		logger.warn(
			`This worker is bound to live services: ${config.services
				.map(
					(service) =>
						`${service.binding} (${service.service}${
							service.environment ? `@${service.environment}` : ""
						})`
				)
				.join(", ")}`
		);
	}

	if (args.inspect) {
		//devtools are enabled by default, but we still need to disable them if the caller doesn't want them
		logger.warn(
			"Passing --inspect is unnecessary, now you can always connect to devtools."
		);
	}

	if (args["experimental-public"]) {
		throw new Error(
			"The --experimental-public field has been renamed to --assets"
		);
	}

	if (args.public) {
		throw new Error("The --public field has been renamed to --assets");
	}

	if ((args.assets || config.assets) && (args.site || config.site)) {
		throw new Error("Cannot use Assets and Workers Sites in the same Worker.");
	}

	if (args.assets) {
		logger.warn(
			"The --assets argument is experimental and may change or break at any time"
		);
	}
	const upstreamProtocol =
		args["upstream-protocol"] || config.dev.upstream_protocol;
	if (upstreamProtocol === "http") {
		logger.warn(
			"Setting upstream-protocol to http is not currently implemented.\n" +
				"If this is required in your project, please add your use case to the following issue:\n" +
				"https://github.com/cloudflare/wrangler2/issues/583."
		);
	}
	const nodeCompat = args.nodeCompat ?? config.node_compat;
	if (nodeCompat) {
		logger.warn(
			"Enabling node.js compatibility mode for built-ins and globals. This is experimental and has serious tradeoffs. Please see https://github.com/ionic-team/rollup-plugin-node-polyfills/ for more details."
		);
	}

	if (args.experimentalEnableLocalPersistence) {
		logger.warn(
			`--experimental-enable-local-persistence is deprecated.\n` +
				`Move any existing data to .wrangler/state and use --persist, or\n` +
				`use --persist-to=./wrangler-local-state to keep using the old path.`
		);
	}

	const localPersistencePath = getLocalPersistencePath(
		args.persistTo,
		Boolean(args.persist),
		config.configPath
	);

	const cliDefines = collectKeyValues(args.define);

	return {
		entry,
		upstreamProtocol,
		nodeCompat,
		getLocalPort,
		getInspectorPort,
		zoneId,
		host,
		routes,
		cliDefines,
		localPersistencePath,
	};
}

async function getBindingsAndAssetPaths(
	args: StartDevOptions,
	configParam: Config
) {
	const cliVars = collectKeyValues(args.var);

	// now log all available bindings into the terminal
	const bindings = await getBindings(configParam, args.env, {
		kv: args.kv,
		vars: { ...args.vars, ...cliVars },
		durableObjects: args.durableObjects,
		r2: args.r2,
		d1Databases: args.d1Databases,
	});

	const maskedVars = maskVars(bindings, configParam);

	printBindings({
		...bindings,
		vars: maskedVars,
	});

	const assetPaths =
		args.assets || configParam.assets
			? getAssetPaths(configParam, args.assets)
			: getSiteAssetPaths(
					configParam,
					args.site,
					args.siteInclude,
					args.siteExclude
			  );
	return { assetPaths, bindings };
}

async function getBindings(
	configParam: Config,
	env: string | undefined,
	args: AdditionalDevProps
): Promise<CfWorkerInit["bindings"]> {
	const bindings = {
		kv_namespaces: [
			...(configParam.kv_namespaces || []).map(
				({ binding, preview_id, id: _id }) => {
					// In `dev`, we make folks use a separate kv namespace called
					// `preview_id` instead of `id` so that they don't
					// break production data. So here we check that a `preview_id`
					// has actually been configured.
					// This whole block of code will be obsoleted in the future
					// when we have copy-on-write for previews on edge workers.
					if (!preview_id) {
						// TODO: This error has to be a _lot_ better, ideally just asking
						// to create a preview namespace for the user automatically
						throw new Error(
							`In development, you should use a separate kv namespace than the one you'd use in production. Please create a new kv namespace with "wrangler kv:namespace create <name> --preview" and add its id as preview_id to the kv_namespace "${binding}" in your wrangler.toml`
						); // Ugh, I really don't like this message very much
					}
					return {
						binding,
						id: preview_id,
					};
				}
			),
			...(args.kv || []),
		],
		// Use a copy of combinedVars since we're modifying it later
		vars: {
			...getVarsForDev(configParam, env),
			...args.vars,
		},
		wasm_modules: configParam.wasm_modules,
		text_blobs: configParam.text_blobs,
		data_blobs: configParam.data_blobs,
		durable_objects: {
			bindings: [
				...(configParam.durable_objects || { bindings: [] }).bindings,
				...(args.durableObjects || []),
			],
		},
		queues: [
			...(configParam.queues.producers || []).map((queue) => {
				return { binding: queue.binding, queue_name: queue.queue };
			}),
		],
		r2_buckets: [
			...(configParam.r2_buckets?.map(
				({ binding, preview_bucket_name, bucket_name: _bucket_name }) => {
					// same idea as kv namespace preview id,
					// same copy-on-write TODO
					if (!preview_bucket_name) {
						throw new Error(
							`In development, you should use a separate r2 bucket than the one you'd use in production. Please create a new r2 bucket with "wrangler r2 bucket create <name>" and add its name as preview_bucket_name to the r2_buckets "${binding}" in your wrangler.toml`
						);
					}
					return {
						binding,
						bucket_name: preview_bucket_name,
					};
				}
			) || []),
			...(args.r2 || []),
		],
		dispatch_namespaces: configParam.dispatch_namespaces,
		services: configParam.services,
		unsafe: configParam.unsafe?.bindings,
		logfwdr: configParam.logfwdr,
		d1_databases: identifyD1BindingsAsBeta([
			...configParam.d1_databases,
			...(args.d1Databases || []),
		]),
	};

	return bindings;
}
