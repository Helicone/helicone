import assert from "node:assert";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { URLSearchParams } from "node:url";
import chalk from "chalk";
import tmp from "tmp-promise";
import { bundleWorker } from "../bundle";
import {
	printBundleSize,
	printOffendingDependencies,
} from "../bundle-reporter";
import { fetchListResult, fetchResult } from "../cfetch";
import { printBindings } from "../config";
import { createWorkerUploadForm } from "../create-worker-upload-form";
import { confirm, fromDashMessagePrompt } from "../dialogs";
import { getMigrationsToUpload } from "../durable";
import { logger } from "../logger";
import { getMetricsUsageHeaders } from "../metrics";
import { ParseError } from "../parse";
import { getQueue, putConsumer } from "../queues/client";
import { getWorkersDevSubdomain } from "../routes";
import { syncAssets } from "../sites";
import { identifyD1BindingsAsBeta } from "../worker";
import { getZoneForRoute } from "../zones";
import type { FetchError } from "../cfetch";
import type { Config } from "../config";
import type {
	Route,
	ZoneIdRoute,
	ZoneNameRoute,
	CustomDomainRoute,
} from "../config/environment";
import type { DeploymentListRes } from "../deployments";
import type { Entry } from "../entry";
import type { PutConsumerBody } from "../queues/client";
import type { AssetPaths } from "../sites";
import type { CfWorkerInit } from "../worker";

type Props = {
	config: Config;
	accountId: string | undefined;
	entry: Entry;
	rules: Config["rules"];
	name: string | undefined;
	env: string | undefined;
	compatibilityDate: string | undefined;
	compatibilityFlags: string[] | undefined;
	assetPaths: AssetPaths | undefined;
	vars: Record<string, string> | undefined;
	defines: Record<string, string> | undefined;
	triggers: string[] | undefined;
	routes: string[] | undefined;
	legacyEnv: boolean | undefined;
	jsxFactory: string | undefined;
	jsxFragment: string | undefined;
	tsconfig: string | undefined;
	isWorkersSite: boolean;
	minify: boolean | undefined;
	nodeCompat: boolean | undefined;
	outDir: string | undefined;
	dryRun: boolean | undefined;
	noBundle: boolean | undefined;
	keepVars: boolean | undefined;
	logpush: boolean | undefined;
};

type RouteObject = ZoneIdRoute | ZoneNameRoute | CustomDomainRoute;

export type CustomDomain = {
	id: string;
	zone_id: string;
	zone_name: string;
	hostname: string;
	service: string;
	environment: string;
};
type UpdatedCustomDomain = CustomDomain & { modified: boolean };
type ConflictingCustomDomain = CustomDomain & {
	external_dns_record_id?: string;
	external_cert_id?: string;
};

export type CustomDomainChangeset = {
	added: CustomDomain[];
	removed: CustomDomain[];
	updated: UpdatedCustomDomain[];
	conflicting: ConflictingCustomDomain[];
};

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const scriptStartupErrorRegex = /startup/i;

function errIsScriptSizeOrStartupErr(err: unknown) {
	if (!err) return false;

	// 10027 = workers.api.error.script_too_large
	if ((err as { code: number }).code === 10027) {
		return true;
	}

	// 10021 = validation error
	// no explicit error code for more granular errors than "invalid script"
	// but the error will contain a string error message directly from the
	// validator.
	// the error always SHOULD look like "Script startup exceeded CPU limit."
	// (or the less likely "Script startup exceeded memory limits.")
	if (
		(err as { code: number }).code === 10021 &&
		err instanceof ParseError &&
		scriptStartupErrorRegex.test(err.notes[0]?.text)
	) {
		return true;
	}

	return false;
}

function renderRoute(route: Route): string {
	let result = "";
	if (typeof route === "string") {
		result = route;
	} else {
		result = route.pattern;
		const isCustomDomain = Boolean(
			"custom_domain" in route && route.custom_domain
		);
		if (isCustomDomain && "zone_id" in route) {
			result += ` (custom domain - zone id: ${route.zone_id})`;
		} else if (isCustomDomain && "zone_name" in route) {
			result += ` (custom domain - zone name: ${route.zone_name})`;
		} else if (isCustomDomain) {
			result += ` (custom domain)`;
		} else if ("zone_id" in route) {
			result += ` (zone id: ${route.zone_id})`;
		} else if ("zone_name" in route) {
			result += ` (zone name: ${route.zone_name})`;
		}
	}
	return result;
}

// publishing to custom domains involves a few more steps than just updating
// the routing table, and thus the api implementing it is fairly defensive -
// it will error eagerly on conflicts against existing domains or existing
// managed DNS records

// however, you can pass params to override the errors. to know if we should
// override the current state, we generate a "changeset" of required actions
// to get to the state we want (specified by the list of custom domains). the
// changeset returns an "updated" collection (existing custom domains
// connected to other scripts) and a "conflicting" collection (the requested
// custom domains that have a managed, conflicting DNS record preventing the
// host's use as a custom domain). with this information, we can prompt to
// the user what will occur if we create the custom domains requested, and
// add the override param if they confirm the action
//
// if a user does not confirm that they want to override, we skip publishing
// to these custom domains, but continue on through the rest of the
// publish stage
async function publishCustomDomains(
	workerUrl: string,
	accountId: string,
	domains: Array<RouteObject>
): Promise<string[]> {
	const config = {
		override_scope: true,
		override_existing_origin: false,
		override_existing_dns_record: false,
	};
	const origins = domains.map((domainRoute) => {
		return {
			hostname: domainRoute.pattern,
			zone_id: "zone_id" in domainRoute ? domainRoute.zone_id : undefined,
			zone_name: "zone_name" in domainRoute ? domainRoute.zone_name : undefined,
		};
	});

	const fail = () => {
		return [
			domains.length > 1
				? `Publishing to ${domains.length} Custom Domains was skipped, fix conflicts and try again`
				: `Publishing to Custom Domain "${domains[0].pattern}" was skipped, fix conflict and try again`,
		];
	};

	if (!process.stdout.isTTY) {
		// running in non-interactive mode.
		// existing origins / dns records are not indicative of errors,
		// so we aggressively update rather than aggressively fail
		config.override_existing_origin = true;
		config.override_existing_dns_record = true;
	} else {
		// get a changeset for operations required to achieve a state with the requested domains
		const changeset = await fetchResult<CustomDomainChangeset>(
			`${workerUrl}/domains/changeset?replace_state=true`,
			{
				method: "POST",
				body: JSON.stringify(origins),
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		const updatesRequired = changeset.updated.filter(
			(domain) => domain.modified
		);
		if (updatesRequired.length > 0) {
			// find out which scripts the conflict domains are already attached to
			// so we can provide that in the confirmation prompt
			const existing = await Promise.all(
				updatesRequired.map((domain) =>
					fetchResult<CustomDomain>(
						`/accounts/${accountId}/workers/domains/records/${domain.id}`
					)
				)
			);
			const existingRendered = existing
				.map(
					(domain) =>
						`\t• ${domain.hostname} (used as a domain for "${domain.service}")`
				)
				.join("\n");
			const message = `Custom Domains already exist for these domains:
${existingRendered}
Update them to point to this script instead?`;
			if (!(await confirm(message))) return fail();
			config.override_existing_origin = true;
		}

		if (changeset.conflicting.length > 0) {
			const conflicitingRendered = changeset.conflicting
				.map((domain) => `\t• ${domain.hostname}`)
				.join("\n");
			const message = `You already have DNS records that conflict for these Custom Domains:
${conflicitingRendered}
Update them to point to this script instead?`;
			if (!(await confirm(message))) return fail();
			config.override_existing_dns_record = true;
		}
	}

	// publish to domains
	await fetchResult(`${workerUrl}/domains/records`, {
		method: "PUT",
		body: JSON.stringify({ ...config, origins }),
		headers: {
			"Content-Type": "application/json",
		},
	});

	return domains.map((domain) => renderRoute(domain));
}

export default async function publish(props: Props): Promise<void> {
	// TODO: warn if git/hg has uncommitted changes
	const { config, accountId, name } = props;
	if (accountId && name) {
		try {
			const serviceMetaData = await fetchResult(
				`/accounts/${accountId}/workers/services/${name}`
			);
			const { default_environment } = serviceMetaData as {
				default_environment: {
					script: { last_deployed_from: "dash" | "wrangler" | "api" };
				};
			};

			if (
				(await fromDashMessagePrompt(
					default_environment.script.last_deployed_from
				)) === false
			)
				return;
		} catch (e) {
			// code: 10090, message: workers.api.error.service_not_found
			// is thrown from the above fetchResult on the first publish of a Worker
			if ((e as { code?: number }).code !== 10090) {
				logger.error(e);
			}
		}
	}

	if (!(props.compatibilityDate || config.compatibility_date)) {
		const compatibilityDateStr = `${new Date().getFullYear()}-${(
			new Date().getMonth() +
			1 +
			""
		).padStart(2, "0")}-${(new Date().getDate() + "").padStart(2, "0")}`;

		throw new Error(`A compatibility_date is required when publishing. Add the following to your wrangler.toml file:.
    \`\`\`
    compatibility_date = "${compatibilityDateStr}"
    \`\`\`
    Or you could pass it in your terminal as \`--compatibility-date ${compatibilityDateStr}\`
See https://developers.cloudflare.com/workers/platform/compatibility-dates for more information.`);
	}

	const triggers = props.triggers || config.triggers?.crons;
	const routes =
		props.routes ?? config.routes ?? (config.route ? [config.route] : []) ?? [];
	const routesOnly: Array<Route> = [];
	const customDomainsOnly: Array<RouteObject> = [];
	for (const route of routes) {
		if (typeof route !== "string" && route.custom_domain) {
			if (route.pattern.includes("*")) {
				throw new Error(
					`Cannot use "${route.pattern}" as a Custom Domain; wildcard operators (*) are not allowed`
				);
			}
			if (route.pattern.includes("/")) {
				throw new Error(
					`Cannot use "${route.pattern}" as a Custom Domain; paths are not allowed`
				);
			}
			customDomainsOnly.push(route);
		} else {
			routesOnly.push(route);
		}
	}

	// deployToWorkersDev defaults to true only if there aren't any routes defined
	const deployToWorkersDev = config.workers_dev ?? routes.length === 0;

	const jsxFactory = props.jsxFactory || config.jsx_factory;
	const jsxFragment = props.jsxFragment || config.jsx_fragment;
	const keepVars = props.keepVars ?? config.keep_vars;

	const minify = props.minify ?? config.minify;

	const nodeCompat = props.nodeCompat ?? config.node_compat;
	if (nodeCompat) {
		logger.warn(
			"Enabling node.js compatibility mode for built-ins and globals. This is experimental and has serious tradeoffs. Please see https://github.com/ionic-team/rollup-plugin-node-polyfills/ for more details."
		);
	}

	// Warn if user tries minify or node-compat with no-bundle
	if (props.noBundle && minify) {
		logger.warn(
			"`--minify` and `--no-bundle` can't be used together. If you want to minify your Worker and disable Wrangler's bundling, please minify as part of your own bundling process."
		);
	}

	if (props.noBundle && nodeCompat) {
		logger.warn(
			"`--node-compat` and `--no-bundle` can't be used together. If you want to polyfill Node.js built-ins and disable Wrangler's bundling, please polyfill as part of your own bundling process."
		);
	}

	const scriptName = props.name;
	assert(
		scriptName,
		'You need to provide a name when publishing a worker. Either pass it as a cli arg with `--name <name>` or in your config file as `name = "<name>"`'
	);

	assert(
		!config.site || config.site.bucket,
		"A [site] definition requires a `bucket` field with a path to the site's assets directory."
	);

	if (props.outDir) {
		// we're using a custom output directory,
		// so let's first ensure it exists
		mkdirSync(props.outDir, { recursive: true });
		// add a README
		const readmePath = path.join(props.outDir, "README.md");
		writeFileSync(
			readmePath,
			`This folder contains the built output assets for the worker "${scriptName}" generated at ${new Date().toISOString()}.`
		);
	}

	const destination = props.outDir ?? (await tmp.dir({ unsafeCleanup: true }));
	const envName = props.env ?? "production";

	const start = Date.now();
	const notProd = Boolean(!props.legacyEnv && props.env);
	const workerName = notProd ? `${scriptName} (${envName})` : scriptName;
	const workerUrl = notProd
		? `/accounts/${accountId}/workers/services/${scriptName}/environments/${envName}`
		: `/accounts/${accountId}/workers/scripts/${scriptName}`;

	let available_on_subdomain: boolean | undefined = undefined; // we'll set this later
	let scriptTag: string | null = null;

	const { format } = props.entry;

	if (
		!props.isWorkersSite &&
		Boolean(props.assetPaths) &&
		format === "service-worker"
	) {
		throw new Error(
			"You cannot use the service-worker format with an `assets` directory yet. For information on how to migrate to the module-worker format, see: https://developers.cloudflare.com/workers/learning/migrating-to-module-workers/"
		);
	}

	if (config.wasm_modules && format === "modules") {
		throw new Error(
			"You cannot configure [wasm_modules] with an ES module worker. Instead, import the .wasm module directly in your code"
		);
	}

	if (config.text_blobs && format === "modules") {
		throw new Error(
			"You cannot configure [text_blobs] with an ES module worker. Instead, import the file directly in your code, and optionally configure `[rules]` in your wrangler.toml"
		);
	}

	if (config.data_blobs && format === "modules") {
		throw new Error(
			"You cannot configure [data_blobs] with an ES module worker. Instead, import the file directly in your code, and optionally configure `[rules]` in your wrangler.toml"
		);
	}
	try {
		if (props.noBundle) {
			// if we're not building, let's just copy the entry to the destination directory
			const destinationDir =
				typeof destination === "string" ? destination : destination.path;
			mkdirSync(destinationDir, { recursive: true });
			writeFileSync(
				path.join(destinationDir, path.basename(props.entry.file)),
				readFileSync(props.entry.file, "utf-8")
			);
		}

		// If we are using d1 bindings, and are not bundling the worker
		// we should error here as the d1 shim won't be added
		const betaD1Shims = identifyD1BindingsAsBeta(config.d1_databases);
		if (
			Array.isArray(betaD1Shims) &&
			betaD1Shims.length > 0 &&
			props.noBundle
		) {
			throw new Error(
				"While in beta, you cannot use D1 bindings without bundling your worker. Please remove `no_bundle` from your wrangler.toml file or remove the `--no-bundle` flag to access D1 bindings."
			);
		}

		const {
			modules,
			dependencies,
			resolvedEntryPointPath,
			bundleType,
		}: Awaited<ReturnType<typeof bundleWorker>> = props.noBundle
			? // we can skip the whole bundling step and mock a bundle here
			  {
					modules: [],
					dependencies: {},
					resolvedEntryPointPath: props.entry.file,
					bundleType: props.entry.format === "modules" ? "esm" : "commonjs",
					stop: undefined,
			  }
			: await bundleWorker(
					props.entry,
					typeof destination === "string" ? destination : destination.path,
					{
						serveAssetsFromWorker:
							!props.isWorkersSite && Boolean(props.assetPaths),
						betaD1Shims: identifyD1BindingsAsBeta(config.d1_databases)?.map(
							(db) => db.binding
						),
						jsxFactory,
						jsxFragment,
						rules: props.rules,
						tsconfig: props.tsconfig ?? config.tsconfig,
						minify,
						nodeCompat,
						define: { ...config.define, ...props.defines },
						checkFetch: false,
						assets: config.assets && {
							...config.assets,
							// enable the cache when publishing
							bypassCache: false,
						},
						services: config.services,
						// We don't set workerDefinitions here,
						// because we don't want to apply the dev-time
						// facades on top of it
						workerDefinitions: undefined,
						firstPartyWorkerDevFacade: false,
						// We want to know if the build is for development or publishing
						// This could potentially cause issues as we no longer have identical behaviour between dev and publish?
						targetConsumer: "publish",
						local: false,
						experimentalLocal: false,
					}
			  );

		const content = readFileSync(resolvedEntryPointPath, {
			encoding: "utf-8",
		});

		// durable object migrations
		const migrations = !props.dryRun
			? await getMigrationsToUpload(scriptName, {
					accountId,
					config,
					legacyEnv: props.legacyEnv,
					env: props.env,
			  })
			: undefined;

		const assets = await syncAssets(
			accountId,
			// When we're using the newer service environments, we wouldn't
			// have added the env name on to the script name. However, we must
			// include it in the kv namespace name regardless (since there's no
			// concept of service environments for kv namespaces yet).
			scriptName + (!props.legacyEnv && props.env ? `-${props.env}` : ""),
			props.assetPaths,
			false,
			props.dryRun
		);

		const bindings: CfWorkerInit["bindings"] = {
			kv_namespaces: (config.kv_namespaces || []).concat(
				assets.namespace
					? { binding: "__STATIC_CONTENT", id: assets.namespace }
					: []
			),
			vars: { ...config.vars, ...props.vars },
			wasm_modules: config.wasm_modules,
			text_blobs: {
				...config.text_blobs,
				...(assets.manifest &&
					format === "service-worker" && {
						__STATIC_CONTENT_MANIFEST: "__STATIC_CONTENT_MANIFEST",
					}),
			},
			data_blobs: config.data_blobs,
			durable_objects: config.durable_objects,
			queues: config.queues.producers?.map((producer) => {
				return { binding: producer.binding, queue_name: producer.queue };
			}),
			r2_buckets: config.r2_buckets,
			d1_databases: identifyD1BindingsAsBeta(config.d1_databases),
			services: config.services,
			dispatch_namespaces: config.dispatch_namespaces,
			logfwdr: config.logfwdr,
			unsafe: config.unsafe?.bindings,
		};

		if (assets.manifest) {
			modules.push({
				name: "__STATIC_CONTENT_MANIFEST",
				content: JSON.stringify(assets.manifest),
				type: "text",
			});
		}

		const worker: CfWorkerInit = {
			name: scriptName,
			main: {
				name: path.basename(resolvedEntryPointPath),
				content: content,
				type: bundleType,
			},
			bindings,
			migrations,
			modules,
			compatibility_date: props.compatibilityDate ?? config.compatibility_date,
			compatibility_flags:
				props.compatibilityFlags ?? config.compatibility_flags,
			usage_model: config.usage_model,
			keepVars,
			logpush: props.logpush !== undefined ? props.logpush : config.logpush,
		};

		// As this is not deterministic for testing, we detect if in a jest environment and run asynchronously
		// We do not care about the timing outside of testing
		const bundleSizePromise = printBundleSize(
			{ name: path.basename(resolvedEntryPointPath), content: content },
			modules
		);
		if (process.env.JEST_WORKER_ID !== undefined) await bundleSizePromise;
		else void bundleSizePromise;

		const withoutStaticAssets = {
			...bindings,
			kv_namespaces: config.kv_namespaces,
			text_blobs: config.text_blobs,
		};

		// mask anything that was overridden in cli args
		// so that we don't log potential secrets into the terminal
		const maskedVars = { ...withoutStaticAssets.vars };
		for (const key of Object.keys(maskedVars)) {
			if (maskedVars[key] !== config.vars[key]) {
				// This means it was overridden in cli args
				// so let's mask it
				maskedVars[key] = "(hidden)";
			}
		}

		printBindings({ ...withoutStaticAssets, vars: maskedVars });

		await ensureQueuesExist(config);

		if (!props.dryRun) {
			// Upload the script so it has time to propagate.
			// We can also now tell whether available_on_subdomain is set
			try {
				const result = await fetchResult<{
					available_on_subdomain: boolean;
					id: string | null;
					etag: string | null;
					pipeline_hash: string | null;
					tag: string | null;
				}>(
					workerUrl,
					{
						method: "PUT",
						body: createWorkerUploadForm(worker),
						headers: await getMetricsUsageHeaders(config.send_metrics),
					},
					new URLSearchParams({
						include_subdomain_availability: "true",
						// pass excludeScript so the whole body of the
						// script doesn't get included in the response
						excludeScript: "true",
					})
				);

				available_on_subdomain = result.available_on_subdomain;
				scriptTag = result.tag;

				if (config.first_party_worker) {
					// Print some useful information returned after publishing
					// Not all fields will be populated for every worker
					// These fields are likely to be scraped by tools, so do not rename
					if (result.id) logger.log("Worker ID: ", result.id);
					if (result.etag) logger.log("Worker ETag: ", result.etag);
					if (result.pipeline_hash)
						logger.log("Worker PipelineHash: ", result.pipeline_hash);
				}
			} catch (err) {
				if (errIsScriptSizeOrStartupErr(err)) {
					printOffendingDependencies(dependencies);
				}
				throw err;
			}
		}
	} finally {
		if (typeof destination !== "string") {
			// this means we're using a temp dir,
			// so let's clean up before we proceed
			await destination.cleanup();
		}
	}

	if (props.dryRun) {
		logger.log(`--dry-run: exiting now.`);
		return;
	}
	assert(accountId, "Missing accountId");

	const uploadMs = Date.now() - start;
	const deployments: Promise<string[]>[] = [];

	if (deployToWorkersDev) {
		// Deploy to a subdomain of `workers.dev`
		const userSubdomain = await getWorkersDevSubdomain(accountId);
		const scriptURL =
			props.legacyEnv || !props.env
				? `${scriptName}.${userSubdomain}.workers.dev`
				: `${envName}.${scriptName}.${userSubdomain}.workers.dev`;
		if (!available_on_subdomain) {
			// Enable the `workers.dev` subdomain.
			deployments.push(
				fetchResult(`${workerUrl}/subdomain`, {
					method: "POST",
					body: JSON.stringify({ enabled: true }),
					headers: {
						"Content-Type": "application/json",
					},
				})
					.then(() => [scriptURL])
					// Add a delay when the subdomain is first created.
					// This is to prevent an issue where a negative cache-hit
					// causes the subdomain to be unavailable for 30 seconds.
					// This is a temporary measure until we fix this on the edge.
					.then(async (url) => {
						await sleep(3000);
						return url;
					})
			);
		} else {
			deployments.push(Promise.resolve([scriptURL]));
		}
	} else {
		if (available_on_subdomain) {
			// Disable the workers.dev deployment
			await fetchResult(`${workerUrl}/subdomain`, {
				method: "POST",
				body: JSON.stringify({ enabled: false }),
				headers: {
					"Content-Type": "application/json",
				},
			});
		} else if (routes.length !== 0) {
			// if you get to this point it's because
			// you're trying to deploy a worker to a custom
			// domain that's already bound to another worker.
			// so this thing is about finding workers that have
			// bindings to the routes you're trying to deploy to.
			//
			// the logic is kinda similar (read: duplicated) from publishRoutesFallback,
			// except here we know we have a good API token or whatever so we don't need
			// to bother with all the error handling tomfoolery.
			const routesWithOtherBindings: Record<string, string[]> = {};
			for (const route of routes) {
				const zone = await getZoneForRoute(route);
				if (!zone) {
					continue;
				}

				const routePattern = typeof route === "string" ? route : route.pattern;
				const routesInZone = await fetchListResult<{
					pattern: string;
					script: string;
				}>(`/zones/${zone.id}/workers/routes`);

				routesInZone.forEach(({ script, pattern }) => {
					if (pattern === routePattern && script !== scriptName) {
						if (!(script in routesWithOtherBindings)) {
							routesWithOtherBindings[script] = [];
						}

						routesWithOtherBindings[script].push(pattern);
					}
				});
			}

			if (Object.keys(routesWithOtherBindings).length > 0) {
				let errorMessage =
					"Can't publish a worker to routes that are assigned to another worker.\n";

				for (const worker in routesWithOtherBindings) {
					const assignedRoutes = routesWithOtherBindings[worker];
					errorMessage += `"${worker}" is already assigned to routes:\n${assignedRoutes.map(
						(r) => `  - ${chalk.underline(r)}\n`
					)}`;
				}

				const resolution =
					"Unassign other workers from the routes you want to publish to, and then try again.";
				const dashLink = `Visit ${chalk.blue(
					chalk.underline(
						`https://dash.cloudflare.com/${accountId}/workers/overview`
					)
				)} to unassign a worker from a route.`;

				throw new Error(`${errorMessage}\n${resolution}\n${dashLink}`);
			}
		}
	}

	logger.log("Uploaded", workerName, formatTime(uploadMs));

	// Update routing table for the script.
	if (routesOnly.length > 0) {
		deployments.push(
			publishRoutes(routesOnly, { workerUrl, scriptName, notProd }).then(() => {
				if (routesOnly.length > 10) {
					return routesOnly
						.slice(0, 9)
						.map((route) => renderRoute(route))
						.concat([`...and ${routesOnly.length - 10} more routes`]);
				}
				return routesOnly.map((route) => renderRoute(route));
			})
		);
	}

	// Update custom domains for the script
	if (customDomainsOnly.length > 0) {
		deployments.push(
			publishCustomDomains(workerUrl, accountId, customDomainsOnly)
		);
	}

	// Configure any schedules for the script.
	// TODO: rename this to `schedules`?
	if (triggers && triggers.length) {
		deployments.push(
			fetchResult(`${workerUrl}/schedules`, {
				// Note: PUT will override previous schedules on this script.
				method: "PUT",
				body: JSON.stringify(triggers.map((cron) => ({ cron }))),
				headers: {
					"Content-Type": "application/json",
				},
			}).then(() => triggers.map((trigger) => `schedule: ${trigger}`))
		);
	}

	if (config.queues.consumers && config.queues.consumers.length) {
		deployments.push(...updateQueueConsumers(config));
	}

	const targets = await Promise.all(deployments);
	const deployMs = Date.now() - start - uploadMs;

	if (deployments.length > 0) {
		logger.log("Published", workerName, formatTime(deployMs));
		for (const target of targets.flat()) {
			// Append protocol only on workers.dev domains
			logger.log(
				" ",
				(target.endsWith("workers.dev") ? "https://" : "") + target
			);
		}
	} else {
		logger.log("No publish targets for", workerName, formatTime(deployMs));
	}

	try {
		const deploymentsList = await fetchResult<DeploymentListRes>(
			`/accounts/${accountId}/workers/deployments/by-script/${scriptTag}`
		);

		logger.log("Current Deployment ID:", deploymentsList.latest.id);
	} catch (e) {
		if ((e as { code: number }).code === 10023) {
			// TODO: remove this try/catch once deployments is completely rolled out
		} else {
			throw e;
		}
	}
}

function formatTime(duration: number) {
	return `(${(duration / 1000).toFixed(2)} sec)`;
}

/**
 * Associate the newly deployed Worker with the given routes.
 */
async function publishRoutes(
	routes: Route[],
	{
		workerUrl,
		scriptName,
		notProd,
	}: { workerUrl: string; scriptName: string; notProd: boolean }
): Promise<string[]> {
	try {
		return await fetchResult(`${workerUrl}/routes`, {
			// Note: PUT will delete previous routes on this script.
			method: "PUT",
			body: JSON.stringify(
				routes.map((route) =>
					typeof route !== "object" ? { pattern: route } : route
				)
			),
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (e) {
		if (isAuthenticationError(e)) {
			// An authentication error is probably due to a known issue,
			// where the user is logged in via an API token that does not have "All Zones".
			return await publishRoutesFallback(routes, { scriptName, notProd });
		} else {
			throw e;
		}
	}
}

/**
 * Try updating routes for the Worker using a less optimal zone-based API.
 *
 * Compute match zones to the routes, then for each route attempt to connect it to the Worker via the zone.
 */
async function publishRoutesFallback(
	routes: Route[],
	{ scriptName, notProd }: { scriptName: string; notProd: boolean }
) {
	if (notProd) {
		throw new Error(
			"Service environments combined with an API token that doesn't have 'All Zones' permissions is not supported.\n" +
				"Either turn off service environments by setting `legacy_env = true`, creating an API token with 'All Zones' permissions, or logging in via OAuth"
		);
	}
	logger.warn(
		"The current authentication token does not have 'All Zones' permissions.\n" +
			"Falling back to using the zone-based API endpoint to update each route individually.\n" +
			"Note that there is no access to routes associated with zones that the API token does not have permission for.\n" +
			"Existing routes for this Worker in such zones will not be deleted."
	);

	const deployedRoutes: string[] = [];

	// Collect the routes (and their zones) that will be deployed.
	const activeZones = new Map<string, string>();
	const routesToDeploy = new Map<string, string>();
	for (const route of routes) {
		const zone = await getZoneForRoute(route);
		if (zone) {
			activeZones.set(zone.id, zone.host);
			routesToDeploy.set(
				typeof route === "string" ? route : route.pattern,
				zone.id
			);
		}
	}

	// Collect the routes that are already deployed.
	const allRoutes = new Map<string, string>();
	const alreadyDeployedRoutes = new Set<string>();
	for (const [zone, host] of activeZones) {
		try {
			for (const { pattern, script } of await fetchListResult<{
				pattern: string;
				script: string;
			}>(`/zones/${zone}/workers/routes`)) {
				allRoutes.set(pattern, script);
				if (script === scriptName) {
					alreadyDeployedRoutes.add(pattern);
				}
			}
		} catch (e) {
			if (isAuthenticationError(e)) {
				e.notes.push({
					text: `This could be because the API token being used does not have permission to access the zone "${host}" (${zone}).`,
				});
			}
			throw e;
		}
	}

	// Deploy each route that is not already deployed.
	for (const [routePattern, zoneId] of routesToDeploy.entries()) {
		if (allRoutes.has(routePattern)) {
			const knownScript = allRoutes.get(routePattern);
			if (knownScript === scriptName) {
				// This route is already associated with this worker, so no need to hit the API.
				alreadyDeployedRoutes.delete(routePattern);
				continue;
			} else {
				throw new Error(
					`The route with pattern "${routePattern}" is already associated with another worker called "${knownScript}".`
				);
			}
		}

		const { pattern } = await fetchResult<{ pattern: string }>(
			`/zones/${zoneId}/workers/routes`,
			{
				method: "POST",
				body: JSON.stringify({
					pattern: routePattern,
					script: scriptName,
				}),
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		deployedRoutes.push(pattern);
	}

	if (alreadyDeployedRoutes.size) {
		logger.warn(
			"Previously deployed routes:\n" +
				"The following routes were already associated with this worker, and have not been deleted:\n" +
				[...alreadyDeployedRoutes.values()].map((route) => ` - "${route}"\n`) +
				"If these routes are not wanted then you can remove them in the dashboard."
		);
	}

	return deployedRoutes;
}

function isAuthenticationError(e: unknown): e is ParseError {
	return e instanceof ParseError && (e as { code?: number }).code === 10000;
}

async function ensureQueuesExist(config: Config) {
	const producers = (config.queues.producers || []).map(
		(producer) => producer.queue
	);
	const consumers = (config.queues.consumers || []).map(
		(consumer) => consumer.queue
	);

	const queueNames = producers.concat(consumers);
	for (const queue of queueNames) {
		try {
			await getQueue(config, queue);
		} catch (err) {
			const queueErr = err as FetchError;
			if (queueErr.code === 11000) {
				// queue_not_found
				throw new Error(
					`Queue "${queue}" does not exist. To create it, run: wrangler queues create ${queue}`
				);
			}
			throw err;
		}
	}
}

function updateQueueConsumers(config: Config): Promise<string[]>[] {
	const consumers = config.queues.consumers || [];
	return consumers.map((consumer) => {
		const body: PutConsumerBody = {
			dead_letter_queue: consumer.dead_letter_queue,
			settings: {
				batch_size: consumer.max_batch_size,
				max_retries: consumer.max_retries,
				max_wait_time_ms: consumer.max_batch_timeout
					? 1000 * consumer.max_batch_timeout
					: undefined,
			},
		};

		if (config.name === undefined) {
			// TODO: how can we reliably get the current script name?
			throw new Error("Script name is required to update queue consumers");
		}
		const scriptName = config.name;
		const envName = undefined; // TODO: script environment for wrangler publish?
		return putConsumer(config, consumer.queue, scriptName, envName, body).then(
			() => [`Consumer for ${consumer.queue}`]
		);
	});
}
