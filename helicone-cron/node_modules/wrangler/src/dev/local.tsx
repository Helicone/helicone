import assert from "node:assert";
import { fork } from "node:child_process";
import { realpathSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { npxImport } from "npx-import";
import { useState, useEffect, useRef } from "react";
import onExit from "signal-exit";
import { performApiFetch } from "../cfetch/internal";
import { registerWorker } from "../dev-registry";
import useInspector from "../inspect";
import { logger } from "../logger";
import {
	DEFAULT_MODULE_RULES,
	ModuleTypeToRuleType,
} from "../module-collection";
import { getBasePath } from "../paths";
import { waitForPortToBeAvailable } from "../proxy";
import { requireAuth } from "../user";
import type { Config } from "../config";
import type { WorkerRegistry } from "../dev-registry";
import type { LoggerLevel } from "../logger";
import type { EnablePagesAssetsServiceBindingOptions } from "../miniflare-cli";
import type { AssetPaths } from "../sites";
import type {
	CfWorkerInit,
	CfScriptFormat,
	CfWasmModuleBindings,
	CfTextBlobBindings,
	CfDataBlobBindings,
	CfDurableObject,
	CfKvNamespace,
	CfR2Bucket,
	CfVars,
	CfQueue,
	CfD1Database,
} from "../worker";
import type { EsbuildBundle } from "./use-esbuild";
import type {
	Miniflare as Miniflare3Type,
	MiniflareOptions as Miniflare3Options,
	Log as Miniflare3LogType,
	CloudflareFetch,
} from "@miniflare/tre";
import type { MiniflareOptions } from "miniflare";
import type { ChildProcess } from "node:child_process";
import type { RequestInit } from "undici";

export interface LocalProps {
	name: string | undefined;
	bundle: EsbuildBundle | undefined;
	format: CfScriptFormat | undefined;
	compatibilityDate: string;
	compatibilityFlags: string[] | undefined;
	usageModel: "bundled" | "unbound" | undefined;
	bindings: CfWorkerInit["bindings"];
	workerDefinitions: WorkerRegistry | undefined;
	assetPaths: AssetPaths | undefined;
	initialPort: number;
	initialIp: string;
	rules: Config["rules"];
	inspectorPort: number;
	localPersistencePath: string | null;
	liveReload: boolean;
	crons: Config["triggers"]["crons"];
	queueConsumers: Config["queues"]["consumers"];
	localProtocol: "http" | "https";
	localUpstream: string | undefined;
	inspect: boolean;
	onReady: ((ip: string, port: number) => void) | undefined;
	logPrefix?: string;
	enablePagesAssetsServiceBinding?: EnablePagesAssetsServiceBindingOptions;
	testScheduled?: boolean;
	experimentalLocal: boolean | undefined;
	accountId: string | undefined; // Account ID? In local mode??? :exploding_head:
	experimentalLocalRemoteKv: boolean | undefined;
}

type InspectorJSON = {
	id: string;
	title: string;
	type: "node";
	description: string;
	webSocketDebuggerUrl: string;
	devtoolsFrontendUrl: string;
	devtoolsFrontendUrlCompat: string;
	faviconUrl: string;
	url: string;
}[];

export function Local(props: LocalProps) {
	const { inspectorUrl } = useLocalWorker(props);
	useInspector({
		inspectorUrl,
		port: props.inspectorPort,
		logToTerminal: props.experimentalLocal ?? false,
	});
	return null;
}

function useLocalWorker({
	name: workerName,
	bundle,
	format,
	compatibilityDate,
	compatibilityFlags,
	usageModel,
	bindings,
	workerDefinitions,
	assetPaths,
	initialPort,
	inspectorPort,
	rules,
	localPersistencePath,
	liveReload,
	initialIp,
	crons,
	queueConsumers,
	localProtocol,
	localUpstream,
	inspect,
	onReady,
	logPrefix,
	enablePagesAssetsServiceBinding,
	experimentalLocal,
	accountId,
	experimentalLocalRemoteKv,
}: LocalProps) {
	// TODO: pass vars via command line
	const local = useRef<ChildProcess>();
	const experimentalLocalRef = useRef<Miniflare3Type>();
	const removeSignalExitListener = useRef<() => void>();
	const removeExperimentalLocalSignalExitListener = useRef<() => void>();
	const [inspectorUrl, setInspectorUrl] = useState<string | undefined>();

	useEffect(() => {
		if (bindings.services && bindings.services.length > 0) {
			logger.warn(
				"⎔ Support for service bindings in local mode is experimental and may change."
			);
		}
	}, [bindings.services]);

	useEffect(() => {
		const externalDurableObjects = (
			bindings.durable_objects?.bindings || []
		).filter((binding) => binding.script_name);

		if (externalDurableObjects.length > 0) {
			logger.warn(
				"⎔ Support for external Durable Objects in local mode is experimental and may change."
			);
		}
	}, [bindings.durable_objects?.bindings]);

	useEffect(() => {
		const abortController = new AbortController();
		async function startLocalWorker() {
			if (!bundle || !format) return;

			// port for the worker
			await waitForPortToBeAvailable(initialPort, {
				retryPeriod: 200,
				timeout: 2000,
				abortSignal: abortController.signal,
			});

			// In local mode, we want to copy all referenced modules into
			// the output bundle directory before starting up
			for (const module of bundle.modules) {
				await writeFile(
					path.join(path.dirname(bundle.path), module.name),
					module.content
				);
			}

			const scriptPath = realpathSync(bundle.path);

			const upstream =
				typeof localUpstream === "string"
					? `${localProtocol}://${localUpstream}`
					: undefined;

			const {
				externalDurableObjects,
				internalDurableObjects,
				wasmBindings,
				textBlobBindings,
				dataBlobBindings,
			} = setupBindings({
				wasm_modules: bindings.wasm_modules,
				text_blobs: bindings.text_blobs,
				data_blobs: bindings.data_blobs,
				durable_objects: bindings.durable_objects,
				format,
				bundle,
			});

			const { forkOptions, miniflareCLIPath, options } = setupMiniflareOptions({
				workerName,
				port: initialPort,
				scriptPath,
				localProtocol,
				ip: initialIp,
				format,
				rules,
				compatibilityDate,
				compatibilityFlags,
				usageModel,
				kv_namespaces: bindings?.kv_namespaces,
				r2_buckets: bindings?.r2_buckets,
				queueBindings: bindings?.queues,
				queueConsumers: queueConsumers,
				d1_databases: bindings?.d1_databases,
				internalDurableObjects,
				externalDurableObjects,
				localPersistencePath,
				liveReload,
				assetPaths,
				vars: bindings?.vars,
				wasmBindings,
				textBlobBindings,
				dataBlobBindings,
				crons,
				upstream,
				logPrefix,
				workerDefinitions,
				enablePagesAssetsServiceBinding,
			});

			if (experimentalLocal) {
				const log = await buildMiniflare3Logger(logPrefix);
				const mf3Options = await transformMf2OptionsToMf3Options({
					miniflare2Options: options,
					format,
					bundle,
					log,
					kvNamespaces: bindings?.kv_namespaces,
					r2Buckets: bindings?.r2_buckets,
					authenticatedAccountId: accountId,
					kvRemote: experimentalLocalRemoteKv,
					inspectorPort,
				});

				const current = experimentalLocalRef.current;

				if (current === undefined) {
					// If we don't have an active Miniflare instance, create a new one
					const { Miniflare } = await getMiniflare3();
					if (abortController.signal.aborted) return;
					const mf = new Miniflare(mf3Options);
					experimentalLocalRef.current = mf;
					removeExperimentalLocalSignalExitListener.current = onExit(() => {
						logger.log("⎔ Shutting down experimental local server.");
						mf.dispose();
						experimentalLocalRef.current = undefined;
					});
					await mf.ready;
				} else {
					// Otherwise, reuse the existing instance with its loopback server
					// and just update the options
					if (abortController.signal.aborted) return;
					logger.log("⎔ Reloading experimental local server.");
					await current.setOptions(mf3Options);
				}

				try {
					// fetch the inspector JSON response from the DevTools Inspector protocol
					const inspectorJSONArr = (await (
						await fetch(`http://127.0.0.1:${inspectorPort}/json`)
					).json()) as InspectorJSON;

					const foundInspectorURL = inspectorJSONArr?.find((inspectorJSON) =>
						inspectorJSON.id.startsWith("core:user")
					)?.webSocketDebuggerUrl;
					if (foundInspectorURL === undefined) {
						setInspectorUrl(undefined);
					} else {
						const url = new URL(foundInspectorURL);
						// Force inspector URL to be different on each reload so `useEffect`
						// in `useInspector` is re-run to connect to newly restarted
						// `workerd` server when updating options. Can't use a query param
						// here as that seems to cause an infinite connection loop, can't
						// use a hash as those are forbidden by `ws`, so username it is.
						url.username = `${Date.now()}-${Math.floor(
							Math.random() * Number.MAX_SAFE_INTEGER
						)}`;
						setInspectorUrl(url.toString());
					}
				} catch (error: unknown) {
					logger.error("Error attempting to retrieve Debugger URL:", error);
				}

				return;
			}

			const nodeOptions = setupNodeOptions({
				inspect,
				ip: initialIp,
				inspectorPort,
			});
			logger.log("⎔ Starting a local server...");

			const child = (local.current = fork(miniflareCLIPath, forkOptions, {
				cwd: path.dirname(scriptPath),
				execArgv: nodeOptions,
				stdio: "pipe",
				env: {
					...process.env,
					FORCE_COLOR: chalk.supportsColor.hasBasic ? "1" : undefined,
				},
			}));

			child.on("message", async (messageString) => {
				const message = JSON.parse(messageString as string);
				if (message.ready) {
					// Let's register our presence in the dev registry
					if (workerName) {
						await registerWorker(workerName, {
							protocol: localProtocol,
							mode: "local",
							port: message.port,
							host: initialIp,
							durableObjects: internalDurableObjects.map((binding) => ({
								name: binding.name,
								className: binding.class_name,
							})),
							...(message.durableObjectsPort
								? {
										durableObjectsHost: initialIp,
										durableObjectsPort: message.durableObjectsPort,
								  }
								: {}),
						});
					}
					onReady?.(initialIp, message.port);
				}
			});

			child.on("close", (code) => {
				if (code) {
					logger.log(`Miniflare process exited with code ${code}`);
				}
			});

			child.stdout?.on("data", (data: Buffer) => {
				process.stdout.write(data);
			});

			// parse the node inspector url (which may be received in chunks) from stderr
			let stderrData = "";
			let inspectorUrlFound = false;
			child.stderr?.on("data", (data: Buffer) => {
				if (!inspectorUrlFound) {
					stderrData += data.toString();
					const matches =
						/Debugger listening on (ws:\/\/127\.0\.0\.1:\d+\/[A-Za-z0-9-]+)[\r|\n]/.exec(
							stderrData
						);
					if (matches) {
						inspectorUrlFound = true;
						setInspectorUrl(matches[1]);
					}
				}

				process.stderr.write(data);
			});

			child.on("exit", (code) => {
				if (code) {
					logger.error(`Miniflare process exited with code ${code}`);
				}
			});

			child.on("error", (error: Error) => {
				logger.error(`Miniflare process failed to spawn`);
				logger.error(error);
			});

			removeSignalExitListener.current = onExit((_code, _signal) => {
				logger.log("⎔ Shutting down local server.");
				child.kill();
				local.current = undefined;
			});
		}

		startLocalWorker().catch((err) => {
			logger.error("local worker:", err);
		});

		return () => {
			abortController.abort();
			if (local.current) {
				logger.log("⎔ Shutting down local server.");
				local.current?.kill();
				local.current = undefined;
			}
			removeSignalExitListener.current?.();
			removeSignalExitListener.current = undefined;
		};
	}, [
		bundle,
		workerName,
		format,
		initialPort,
		inspectorPort,
		initialIp,
		queueConsumers,
		bindings.queues,
		bindings.durable_objects,
		bindings.kv_namespaces,
		bindings.r2_buckets,
		bindings.d1_databases,
		bindings.vars,
		bindings.services,
		workerDefinitions,
		compatibilityDate,
		compatibilityFlags,
		usageModel,
		localPersistencePath,
		liveReload,
		assetPaths,
		rules,
		bindings.wasm_modules,
		bindings.text_blobs,
		bindings.data_blobs,
		crons,
		localProtocol,
		localUpstream,
		inspect,
		logPrefix,
		onReady,
		enablePagesAssetsServiceBinding,
		experimentalLocal,
		accountId,
		experimentalLocalRemoteKv,
	]);

	// Rather than disposing the Miniflare instance on every reload, only dispose
	// it if local mode is disabled and the `Local` component is unmounted. This
	// allows us to use the more efficient `Miniflare#setOptions` on reload which
	// retains internal state (e.g. the Miniflare loopback server).
	useEffect(
		() => () => {
			if (experimentalLocalRef.current) {
				logger.log("⎔ Shutting down experimental local server.");
				// Initialisation errors are also thrown asynchronously by dispose().
				// The catch() above should've caught them though.
				experimentalLocalRef.current?.dispose().catch(() => {});
				experimentalLocalRef.current = undefined;
			}
			removeExperimentalLocalSignalExitListener.current?.();
			removeExperimentalLocalSignalExitListener.current = undefined;
		},
		[]
	);

	return { inspectorUrl };
}

interface SetupBindingsProps {
	wasm_modules: CfWasmModuleBindings | undefined;
	text_blobs: CfTextBlobBindings | undefined;
	data_blobs: CfDataBlobBindings | undefined;
	durable_objects: { bindings: CfDurableObject[] } | undefined;
	bundle: EsbuildBundle;
	format: CfScriptFormat;
}

export function setupBindings({
	wasm_modules,
	text_blobs,
	data_blobs,
	durable_objects,
	format,
	bundle,
}: SetupBindingsProps) {
	// the wasm_modules/text_blobs/data_blobs bindings are
	// relative to process.cwd(), but the actual worker bundle
	// is in the temp output directory; so we rewrite the paths to be absolute,
	// letting miniflare resolve them correctly

	// wasm
	const wasmBindings: Record<string, string> = {};
	for (const [name, filePath] of Object.entries(wasm_modules || {})) {
		wasmBindings[name] = path.join(process.cwd(), filePath);
	}

	// text
	const textBlobBindings: Record<string, string> = {};
	for (const [name, filePath] of Object.entries(text_blobs || {})) {
		textBlobBindings[name] = path.join(process.cwd(), filePath);
	}

	// data
	const dataBlobBindings: Record<string, string> = {};
	for (const [name, filePath] of Object.entries(data_blobs || {})) {
		dataBlobBindings[name] = path.join(process.cwd(), filePath);
	}

	if (format === "service-worker") {
		for (const { type, name } of bundle.modules) {
			if (type === "compiled-wasm") {
				// In service-worker format, .wasm modules are referenced by global identifiers,
				// so we convert it here.
				// This identifier has to be a valid JS identifier, so we replace all non alphanumeric
				// characters with an underscore.
				const identifier = name.replace(/[^a-zA-Z0-9_$]/g, "_");
				wasmBindings[identifier] = name;
			} else if (type === "text") {
				// In service-worker format, text modules are referenced by global identifiers,
				// so we convert it here.
				// This identifier has to be a valid JS identifier, so we replace all non alphanumeric
				// characters with an underscore.
				const identifier = name.replace(/[^a-zA-Z0-9_$]/g, "_");
				textBlobBindings[identifier] = name;
			} else if (type === "buffer") {
				// In service-worker format, data blobs are referenced by global identifiers,
				// so we convert it here.
				// This identifier has to be a valid JS identifier, so we replace all non alphanumeric
				// characters with an underscore.
				const identifier = name.replace(/[^a-zA-Z0-9_$]/g, "_");
				dataBlobBindings[identifier] = name;
			}
		}
	}

	const internalDurableObjects = (durable_objects?.bindings || []).filter(
		(binding) => !binding.script_name
	);
	const externalDurableObjects = (durable_objects?.bindings || []).filter(
		(binding) => binding.script_name
	);
	return {
		internalDurableObjects,
		externalDurableObjects,
		wasmBindings,
		textBlobBindings,
		dataBlobBindings,
	};
}

interface SetupMiniflareOptionsProps {
	workerName: string | undefined;
	port: number;
	scriptPath: string;
	localProtocol: "http" | "https";
	ip: string;
	format: CfScriptFormat;
	rules: Config["rules"];
	compatibilityDate: string;
	compatibilityFlags: string[] | undefined;
	usageModel: "bundled" | "unbound" | undefined;
	kv_namespaces: CfKvNamespace[] | undefined;
	queueBindings: CfQueue[] | undefined;
	queueConsumers: Config["queues"]["consumers"];
	r2_buckets: CfR2Bucket[] | undefined;
	d1_databases: CfD1Database[] | undefined;
	internalDurableObjects: CfDurableObject[];
	externalDurableObjects: CfDurableObject[];
	localPersistencePath: string | null;
	liveReload: boolean;
	assetPaths: AssetPaths | undefined;
	vars: CfVars | undefined;
	wasmBindings: Record<string, string>;
	textBlobBindings: Record<string, string>;
	dataBlobBindings: Record<string, string>;
	crons: Config["triggers"]["crons"];
	upstream: string | undefined;
	logPrefix: string | undefined;
	workerDefinitions: WorkerRegistry | undefined;
	enablePagesAssetsServiceBinding?: EnablePagesAssetsServiceBindingOptions;
}

export function setupMiniflareOptions({
	workerName,
	port,
	scriptPath,
	localProtocol,
	ip,
	format,
	rules,
	compatibilityDate,
	compatibilityFlags,
	usageModel,
	kv_namespaces,
	queueBindings,
	queueConsumers,
	r2_buckets,
	d1_databases,
	internalDurableObjects,
	externalDurableObjects,
	localPersistencePath,
	liveReload,
	assetPaths,
	vars,
	wasmBindings,
	textBlobBindings,
	dataBlobBindings,
	crons,
	upstream,
	logPrefix,
	workerDefinitions,
	enablePagesAssetsServiceBinding,
}: SetupMiniflareOptionsProps): {
	miniflareCLIPath: string;
	forkOptions: string[];
	options: MiniflareOptions;
} {
	// It's now getting _really_ messy now with Pages ASSETS binding outside and the external Durable Objects inside.
	const options: MiniflareOptions = {
		name: workerName,
		port,
		scriptPath,
		https: localProtocol === "https",
		host: ip,
		modules: format === "modules",
		modulesRules: (rules || [])
			.concat(DEFAULT_MODULE_RULES)
			.map(({ type, globs: include, fallthrough }) => ({
				type,
				include,
				fallthrough,
			})),
		compatibilityDate,
		compatibilityFlags,
		usageModel,
		kvNamespaces: kv_namespaces?.map((kv) => kv.binding),
		queueBindings: queueBindings?.map((queue) => {
			return { name: queue.binding, queueName: queue.queue_name };
		}),
		queueConsumers: queueConsumers?.map((consumer) => {
			const waitMs = consumer.max_batch_timeout
				? 1000 * consumer.max_batch_timeout
				: undefined;
			return {
				queueName: consumer.queue,
				maxBatchSize: consumer.max_batch_size,
				maxWaitMs: waitMs,
				maxRetries: consumer.max_retries,
				deadLetterQueue: consumer.dead_letter_queue,
			};
		}),
		r2Buckets: r2_buckets?.map((r2) => r2.binding),
		durableObjects: Object.fromEntries(
			internalDurableObjects.map((binding) => [
				binding.name,
				binding.class_name,
			])
		),
		externalDurableObjects: Object.fromEntries(
			externalDurableObjects
				.map((binding) => {
					const service =
						workerDefinitions &&
						workerDefinitions[binding.script_name as string];
					if (!service) return [binding.name, undefined];

					const name = service.durableObjects.find(
						(durableObject) => durableObject.className === binding.class_name
					)?.name;
					if (!name) return [binding.name, undefined];

					return [
						binding.name,
						{
							name,
							host: service.durableObjectsHost,
							port: service.durableObjectsPort,
						},
					];
				})
				.filter(([_, details]) => !!details)
		),
		d1Databases: d1_databases?.map((db) => db.binding),
		...(localPersistencePath
			? {
					cachePersist: path.join(localPersistencePath, "cache"),
					durableObjectsPersist: path.join(localPersistencePath, "do"),
					kvPersist: path.join(localPersistencePath, "kv"),
					r2Persist: path.join(localPersistencePath, "r2"),
					d1Persist: path.join(localPersistencePath, "d1"),
			  }
			: {
					// We mark these as true, so that they'll
					// persist in the temp directory.
					// This means they'll persist across a dev session,
					// even if we change source and reload,
					// and be deleted when the dev session ends
					cachePersist: true,
					durableObjectsPersist: true,
					kvPersist: true,
					r2Persist: true,
			  }),

		liveReload,
		sitePath: assetPaths?.assetDirectory
			? path.join(assetPaths.baseDirectory, assetPaths.assetDirectory)
			: undefined,
		siteInclude: assetPaths?.includePatterns.length
			? assetPaths?.includePatterns
			: undefined,
		siteExclude: assetPaths?.excludePatterns.length
			? assetPaths.excludePatterns
			: undefined,
		bindings: vars,
		wasmBindings,
		textBlobBindings,
		dataBlobBindings,
		sourceMap: true,
		logUnhandledRejections: true,
		crons,
		upstream,
		logLevel: logger.loggerLevel,
		logOptions: logPrefix ? { prefix: logPrefix } : undefined,
		enablePagesAssetsServiceBinding,
	};
	// The path to the Miniflare CLI assumes that this file is being run from
	// `wrangler-dist` and that the CLI is found in `miniflare-dist`.
	// If either of those paths change this line needs updating.
	const miniflareCLIPath = path.resolve(
		getBasePath(),
		"miniflare-dist/index.mjs"
	);
	const miniflareOptions = JSON.stringify(options, null);
	const forkOptions = [miniflareOptions];
	if (enablePagesAssetsServiceBinding) {
		forkOptions.push(JSON.stringify(enablePagesAssetsServiceBinding));
	}
	return { miniflareCLIPath, forkOptions, options };
}

export function setupNodeOptions({
	inspect,
	ip,
	inspectorPort,
}: {
	inspect: boolean;
	ip: string;
	inspectorPort: number;
}) {
	const nodeOptions = [
		"--experimental-vm-modules", // ensures that Miniflare can run ESM Workers
		"--no-warnings", // hide annoying Node warnings
		// "--log=VERBOSE", // uncomment this to Miniflare to log "everything"!
	];
	if (inspect) {
		nodeOptions.push("--inspect=" + `${ip}:${inspectorPort}`); // start Miniflare listening for a debugger to attach
	}
	return nodeOptions;
}

export interface SetupMiniflare3Options {
	// Regular Miniflare 2 options to transform
	miniflare2Options: MiniflareOptions;
	// Miniflare 3 requires all modules to be manually specified
	format: CfScriptFormat;
	bundle: EsbuildBundle;

	// Miniflare's logger
	log: Miniflare3LogType;

	// Miniflare 3 accepts namespace/bucket names in addition to binding names.
	// This means multiple workers persisting to the same location can have
	// different binding names for the same namespace/bucket. Therefore, we need
	// the full KV/R2 arrays. This is also required for remote KV storage, as
	// we need actual namespace IDs to connect to.
	kvNamespaces: CfKvNamespace[] | undefined;
	r2Buckets: CfR2Bucket[] | undefined;

	// Account ID to use for authenticated Cloudflare fetch. If true, prompt
	// user for ID if multiple available.
	authenticatedAccountId: string | true | undefined;
	// Whether to read/write from/to real KV namespaces
	kvRemote: boolean | undefined;

	// Port to start DevTools inspector server on
	inspectorPort: number;
}

export async function buildMiniflare3Logger(
	logPrefix?: string
): Promise<Miniflare3LogType> {
	const { Log, NoOpLog, LogLevel } = await getMiniflare3();

	let level = logger.loggerLevel.toUpperCase() as Uppercase<LoggerLevel>;
	if (level === "LOG") level = "INFO";
	const logLevel = LogLevel[level];

	return logLevel === LogLevel.NONE
		? new NoOpLog()
		: new Log(logLevel, { prefix: logPrefix });
}

export async function transformMf2OptionsToMf3Options({
	miniflare2Options,
	format,
	bundle,
	log,
	kvNamespaces,
	r2Buckets,
	authenticatedAccountId,
	kvRemote,
	inspectorPort,
}: SetupMiniflare3Options): Promise<Miniflare3Options> {
	// Build authenticated Cloudflare API fetch function if required
	let cloudflareFetch: CloudflareFetch | undefined;
	if (kvRemote && authenticatedAccountId !== undefined) {
		const preferredAccountId =
			authenticatedAccountId === true ? undefined : authenticatedAccountId;
		const accountId = await requireAuth({ account_id: preferredAccountId });
		cloudflareFetch = (resource, searchParams, init) => {
			resource = `/accounts/${accountId}/${resource}`;
			// Miniflare and Wrangler's `undici` versions may be slightly different,
			// but their `RequestInit` types *should* be compatible
			return performApiFetch(resource, init as RequestInit, searchParams);
		};
	}

	const options: Miniflare3Options = {
		...miniflare2Options,
		// Miniflare 3 distinguishes between binding name and namespace/bucket IDs.
		kvNamespaces: Object.fromEntries(
			kvNamespaces?.map(({ binding, id }) => [binding, id]) ?? []
		),
		r2Buckets: Object.fromEntries(
			r2Buckets?.map(({ binding, bucket_name }) => [binding, bucket_name]) ?? []
		),
		inspectorPort,
		verbose: true,
		cloudflareFetch,
		log,
	};

	if (format === "modules") {
		// Manually specify all modules from the bundle. If we didn't do this,
		// Miniflare 3 would try collect them automatically again itself.

		// Resolve entrypoint relative to the temporary directory, ensuring
		// path doesn't start with `..`, which causes issues in `workerd`.
		// Also ensures other modules with relative names can be resolved.
		const root = path.dirname(bundle.path);

		assert.strictEqual(bundle.type, "esm");
		// Required for source mapped paths to resolve correctly
		options.modulesRoot = root;
		options.modules = [
			// Entrypoint
			{
				type: "ESModule",
				path: bundle.path,
				contents: await readFile(bundle.path, "utf-8"),
			},
			// Misc (WebAssembly, etc, ...)
			...bundle.modules.map((module) => ({
				type: ModuleTypeToRuleType[module.type ?? "esm"],
				path: path.resolve(root, module.name),
				contents: module.content,
			})),
		];
	}

	if (kvRemote) {
		// `kvPersist` is always assigned a truthy value in `setupMiniflareOptions`
		assert(options.kvPersist);
		const kvRemoteCache =
			options.kvPersist === true
				? // If storing in temporary directory, find this path from the bundle
				  // output path
				  path.join(path.dirname(bundle.path), ".mf", "kv-remote")
				: // Otherwise, `kvPersist` looks like `.../kv`, so rewrite it to
				  // `kv-remote` since the expected metadata format for remote storage
				  // is different to local
				  path.join(path.dirname(options.kvPersist), "kv-remote");
		options.kvPersist = `remote:?cache=${encodeURIComponent(kvRemoteCache)}`;
	}

	return options;
}

// Caching of the `npx-import`ed `@miniflare/tre` package
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let miniflare3Module: typeof import("@miniflare/tre");
export async function getMiniflare3(): Promise<
	// eslint-disable-next-line @typescript-eslint/consistent-type-imports
	typeof import("@miniflare/tre")
> {
	return (miniflare3Module ??= await npxImport("@miniflare/tre@3.0.0-next.7"));
}
