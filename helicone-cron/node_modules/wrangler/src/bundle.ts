import assert from "node:assert";
import * as fs from "node:fs";
import { builtinModules } from "node:module";
import * as path from "node:path";
import NodeGlobalsPolyfills from "@esbuild-plugins/node-globals-polyfill";
import NodeModulesPolyfills from "@esbuild-plugins/node-modules-polyfill";
import * as esbuild from "esbuild";
import tmp from "tmp-promise";
import createModuleCollector from "./module-collection";
import { getBasePath, toUrlPath } from "./paths";
import type { Config } from "./config";
import type { WorkerRegistry } from "./dev-registry";
import type { Entry } from "./entry";
import type { CfModule } from "./worker";

export type BundleResult = {
	modules: CfModule[];
	dependencies: esbuild.Metafile["outputs"][string]["inputs"];
	resolvedEntryPointPath: string;
	bundleType: "esm" | "commonjs";
	stop: (() => void) | undefined;
	sourceMapPath?: string | undefined;
};

type StaticAssetsConfig =
	| (Config["assets"] & {
			bypassCache: boolean | undefined;
	  })
	| undefined;

/**
 * When applying the middleware facade for service workers, we need to inject
 * some code at the top of the final output bundle. Applying an inject too early
 * will allow esbuild to reorder the code. Additionally, we need to make sure
 * user code is bundled in the final esbuild step with `watch` correctly
 * configured, so code changes are detected.
 *
 * This type is used as the return type for the `MiddlewareFn` type representing
 * a facade-applying function. Returned injects should be injected with the
 * final esbuild step.
 */
type EntryWithInject = Entry & { inject?: string[] };

/**
 * RegExp matching against esbuild's error text when it is unable to resolve
 * a Node built-in module. If we detect this when node_compat is disabled,
 * we'll rewrite the error to suggest enabling it.
 */
const nodeBuiltinResolveErrorText = new RegExp(
	'^Could not resolve "(' +
		builtinModules.join("|") +
		"|" +
		builtinModules.map((module) => "node:" + module).join("|") +
		')"$'
);

/**
 * Returns true if the passed value looks like an esbuild BuildFailure object
 */
export function isBuildFailure(err: unknown): err is esbuild.BuildFailure {
	return (
		typeof err === "object" &&
		err !== null &&
		"errors" in err &&
		"warnings" in err
	);
}

/**
 * Rewrites esbuild BuildFailures for failing to resolve Node built-in modules
 * to suggest enabling Node compat as opposed to `platform: "node"`.
 */
export function rewriteNodeCompatBuildFailure(err: esbuild.BuildFailure) {
	for (const error of err.errors) {
		const match = nodeBuiltinResolveErrorText.exec(error.text);
		if (match !== null) {
			error.notes = [
				{
					location: null,
					text: `The package "${match[1]}" wasn't found on the file system but is built into node.
Add "node_compat = true" to your wrangler.toml file to enable Node compatibility.`,
				},
			];
		}
	}
}

/**
 * Generate a bundle for the worker identified by the arguments passed in.
 */
export async function bundleWorker(
	entry: Entry,
	destination: string,
	options: {
		serveAssetsFromWorker: boolean;
		assets?: StaticAssetsConfig;
		betaD1Shims?: string[];
		jsxFactory?: string;
		jsxFragment?: string;
		rules: Config["rules"];
		watch?: esbuild.WatchMode | boolean;
		tsconfig?: string;
		minify?: boolean;
		nodeCompat?: boolean;
		define: Config["define"];
		checkFetch: boolean;
		services?: Config["services"];
		workerDefinitions?: WorkerRegistry;
		firstPartyWorkerDevFacade?: boolean;
		targetConsumer: "dev" | "publish";
		local: boolean;
		testScheduled?: boolean;
		experimentalLocal?: boolean;
		inject?: string[];
		loader?: Record<string, string>;
		sourcemap?: esbuild.CommonOptions["sourcemap"];
		plugins?: esbuild.Plugin[];
		// TODO: Rip these out https://github.com/cloudflare/wrangler2/issues/2153
		disableModuleCollection?: boolean;
		isOutfile?: boolean;
	}
): Promise<BundleResult> {
	const {
		serveAssetsFromWorker,
		betaD1Shims,
		jsxFactory,
		jsxFragment,
		rules,
		watch,
		tsconfig,
		minify,
		nodeCompat,
		checkFetch,
		local,
		assets,
		workerDefinitions,
		services,
		firstPartyWorkerDevFacade,
		targetConsumer,
		testScheduled,
		experimentalLocal,
		inject: injectOption,
		loader,
		sourcemap,
		plugins,
		disableModuleCollection,
		isOutfile,
	} = options;

	// We create a temporary directory for any oneoff files we
	// need to create. This is separate from the main build
	// directory (`destination`).
	const tmpDir = await tmp.dir({ unsafeCleanup: true });

	const entryDirectory = path.dirname(entry.file);
	let moduleCollector = createModuleCollector({
		wrangler1xlegacyModuleReferences: {
			rootDirectory: entryDirectory,
			fileNames: new Set(
				fs
					.readdirSync(entryDirectory, { withFileTypes: true })
					.filter(
						(dirEntry) =>
							dirEntry.isFile() && dirEntry.name !== path.basename(entry.file)
					)
					.map((dirEnt) => dirEnt.name)
			),
		},
		format: entry.format,
		rules,
	});
	if (disableModuleCollection) {
		moduleCollector = {
			modules: [],
			plugin: {
				name: moduleCollector.plugin.name,
				setup: () => {},
			},
		};
	}

	// In dev, we want to patch `fetch()` with a special version that looks
	// for bad usages and can warn the user about them; so we inject
	// `checked-fetch.js` to do so. However, with yarn 3 style pnp,
	// we need to extract that file to an accessible place before injecting
	// it in, hence this code here.

	const checkedFetchFileToInject = path.join(tmpDir.path, "checked-fetch.js");

	if (checkFetch && !fs.existsSync(checkedFetchFileToInject)) {
		fs.mkdirSync(tmpDir.path, {
			recursive: true,
		});
		fs.writeFileSync(
			checkedFetchFileToInject,
			fs.readFileSync(path.resolve(getBasePath(), "templates/checked-fetch.js"))
		);
	}

	// At this point, we take the opportunity to "wrap" any input workers
	// with any extra functionality we may want to add. This is done by
	// passing the entry point through a pipeline of functions that return
	// a new entry point, that we call "middleware" or "facades".
	// Look at implementations of these functions to learn more.

	// We also have middleware that uses a more "traditional" middleware stack,
	// which is all loaded as one in a stack.
	const middlewareToLoad: MiddlewareLoader[] = [];

	if (testScheduled) {
		middlewareToLoad.push({
			path: "templates/middleware/middleware-scheduled.ts",
		});
	}
	if (experimentalLocal) {
		// In Miniflare 3, we bind the user's worker as a service binding in a
		// special entry worker that handles things like injecting `Request.cf`,
		// live-reload, and the pretty-error page.
		//
		// Unfortunately, due to a bug in `workerd`, errors thrown asynchronously by
		// native APIs don't have `stack`s. This means Miniflare can't extract the
		// `stack` trace from dispatching to the user worker service binding by
		// `try/catch`.
		//
		// As a stop-gap solution, if the `MF-Experimental-Error-Stack` header is
		// truthy on responses, the body will be interpreted as a JSON-error of the
		// form `{ message?: string, name?: string, stack?: string }`.
		//
		// This middleware wraps the user's worker in a `try/catch`, and rewrites
		// errors in this format so a pretty-error page can be shown.
		middlewareToLoad.push({
			path: "templates/middleware/middleware-miniflare3-json-error.ts",
			dev: true,
		});
	}

	type MiddlewareFn = (currentEntry: Entry) => Promise<EntryWithInject>;
	const middleware: (false | undefined | MiddlewareFn)[] = [
		// serve static assets
		serveAssetsFromWorker &&
			((currentEntry: Entry) => {
				return applyStaticAssetFacade(currentEntry, tmpDir.path, assets);
			}),
		// format errors nicely
		// We use an env var here because we don't actually
		// want to expose this to the user. It's only used internally to
		// experiment with middleware as a teaching exercise.
		process.env.FORMAT_WRANGLER_ERRORS === "true" &&
			((currentEntry: Entry) => {
				return applyFormatDevErrorsFacade(currentEntry, tmpDir.path);
			}),
		// bind to other dev instances/service bindings
		workerDefinitions &&
			Object.keys(workerDefinitions).length > 0 &&
			services &&
			services.length > 0 &&
			((currentEntry: Entry) => {
				return applyMultiWorkerDevFacade(
					currentEntry,
					tmpDir.path,
					services,
					workerDefinitions
				);
			}),
		// Simulate internal environment when using first party workers in dev
		firstPartyWorkerDevFacade === true &&
			((currentEntry: Entry) => {
				return applyFirstPartyWorkerDevFacade(currentEntry, tmpDir.path);
			}),

		Array.isArray(betaD1Shims) &&
			betaD1Shims.length > 0 &&
			((currentEntry: Entry) => {
				return applyD1BetaFacade(currentEntry, tmpDir.path, betaD1Shims, local);
			}),

		// Middleware loader: to add middleware, we add the path to the middleware
		// Currently for demonstration purposes we have two example middlewares
		// Middlewares are togglable by changing the `publish` (default=false) and `dev` (default=true) options
		// As we are not yet supporting user created middlewares yet, if no wrangler applied middleware
		// are found, we will not load any middleware. We also need to check if there are middlewares compatible with
		// the target consumer (dev / publish).
		(middlewareToLoad.filter(
			(m) =>
				(m.publish && targetConsumer === "publish") ||
				(m.dev !== false && targetConsumer === "dev")
		).length > 0 ||
			process.env.EXPERIMENTAL_MIDDLEWARE === "true") &&
			((currentEntry: Entry) => {
				return applyMiddlewareLoaderFacade(
					currentEntry,
					tmpDir.path,
					middlewareToLoad.filter(
						// We dynamically filter the middleware depending on where we are bundling for
						(m) =>
							(targetConsumer === "dev" && m.dev !== false) ||
							(m.publish && targetConsumer === "publish")
					)
				);
			}),
	].filter(Boolean);

	const inject: string[] = injectOption ?? [];
	if (checkFetch) inject.push(checkedFetchFileToInject);

	let inputEntry: EntryWithInject = entry;
	for (const middlewareFn of middleware as MiddlewareFn[]) {
		inputEntry = await middlewareFn(inputEntry);
		if (inputEntry.inject !== undefined) inject.push(...inputEntry.inject);
	}

	// At this point, inputEntry points to the entry point we want to build.

	const buildOptions: esbuild.BuildOptions & { metafile: true } = {
		entryPoints: [inputEntry.file],
		bundle: true,
		absWorkingDir: entry.directory,
		outdir: destination,
		...(isOutfile
			? {
					outdir: undefined,
					outfile: destination,
			  }
			: {}),
		inject,
		external: ["__STATIC_CONTENT_MANIFEST"],
		format: entry.format === "modules" ? "esm" : "iife",
		target: "es2020",
		sourcemap: sourcemap ?? true, // this needs to use ?? to accept false
		// Include a reference to the output folder in the sourcemap.
		// This is omitted by default, but we need it to properly resolve source paths in error output.
		sourceRoot: destination,
		minify,
		metafile: true,
		conditions: ["worker", "browser"],
		...(process.env.NODE_ENV && {
			define: {
				// use process.env["NODE_ENV" + ""] so that esbuild doesn't replace it
				// when we do a build of wrangler. (re: https://github.com/cloudflare/wrangler2/issues/1477)
				"process.env.NODE_ENV": `"${process.env["NODE_ENV" + ""]}"`,
				...(nodeCompat ? { global: "globalThis" } : {}),
				...(checkFetch ? { fetch: "checkedFetch" } : {}),
				...options.define,
			},
		}),
		loader: {
			".js": "jsx",
			".mjs": "jsx",
			".cjs": "jsx",
			...(loader || {}),
		},
		plugins: [
			moduleCollector.plugin,
			...(nodeCompat
				? [NodeGlobalsPolyfills({ buffer: true }), NodeModulesPolyfills()]
				: []),
			...(plugins || []),
		],
		...(jsxFactory && { jsxFactory }),
		...(jsxFragment && { jsxFragment }),
		...(tsconfig && { tsconfig }),
		watch,
		// The default logLevel is "warning". So that we can rewrite errors before
		// logging, we disable esbuild's default logging, and log build failures
		// ourselves.
		logLevel: "silent",
	};
	let result;
	try {
		result = await esbuild.build(buildOptions);
	} catch (e) {
		if (!nodeCompat && isBuildFailure(e)) rewriteNodeCompatBuildFailure(e);
		throw e;
	}

	const entryPointOutputs = Object.entries(result.metafile.outputs).filter(
		([_path, output]) => output.entryPoint !== undefined
	);
	assert(
		entryPointOutputs.length > 0,
		`Cannot find entry-point "${entry.file}" in generated bundle.` +
			listEntryPoints(entryPointOutputs)
	);
	assert(
		entryPointOutputs.length < 2,
		"More than one entry-point found for generated bundle." +
			listEntryPoints(entryPointOutputs)
	);

	const { exports: entryPointExports, inputs: dependencies } =
		entryPointOutputs[0][1];
	const bundleType = entryPointExports.length > 0 ? "esm" : "commonjs";

	const sourceMapPath = Object.keys(result.metafile.outputs).filter((_path) =>
		_path.includes(".map")
	)[0];

	return {
		modules: moduleCollector.modules,
		dependencies,
		resolvedEntryPointPath: path.resolve(
			entry.directory,
			entryPointOutputs[0][0]
		),
		bundleType,
		stop: result.stop,
		sourceMapPath,
	};
}

/**
 * A simple plugin to alias modules and mark them as external
 */
export function esbuildAliasExternalPlugin(
	aliases: Record<string, string>
): esbuild.Plugin {
	return {
		name: "alias",
		setup(build) {
			build.onResolve({ filter: /.*/g }, (args) => {
				// If it's the entrypoint, let it be as is
				if (args.kind === "entry-point") {
					return {
						path: args.path,
					};
				}
				// If it's not a recognised alias, then throw an error
				if (!Object.keys(aliases).includes(args.path)) {
					throw new Error("unrecognized module: " + args.path);
				}

				// Otherwise, return the alias
				return {
					path: aliases[args.path as keyof typeof aliases],
					external: true,
				};
			});
		},
	};
}

/**
 * A middleware that catches any thrown errors, and instead formats
 * them to be rendered in a browser. This middleware is for demonstration
 * purposes only, and is not intended to be used in production (or even dev!)
 */
async function applyFormatDevErrorsFacade(
	entry: Entry,
	tmpDirPath: string
): Promise<Entry> {
	const targetPath = path.join(tmpDirPath, "format-dev-errors.entry.js");
	await esbuild.build({
		entryPoints: [
			path.resolve(getBasePath(), "templates/format-dev-errors.ts"),
		],
		bundle: true,
		sourcemap: true,
		format: "esm",
		plugins: [
			esbuildAliasExternalPlugin({
				__ENTRY_POINT__: entry.file,
			}),
		],
		outfile: targetPath,
	});

	return {
		...entry,
		file: targetPath,
	};
}

/**
 * A facade that acts as a "middleware loader".
 * Instead of needing to apply a facade for each individual middleware, this allows
 * middleware to be written in a more traditional manner and then be applied all
 * at once, requiring just two esbuild steps, rather than 1 per middleware.
 */

interface MiddlewareLoader {
	path: string;
	// By default all middleware will run on dev, but will not be run when published
	publish?: boolean;
	dev?: boolean;
}

async function applyMiddlewareLoaderFacade(
	entry: Entry,
	tmpDirPath: string,
	middleware: MiddlewareLoader[] // a list of paths to middleware files
): Promise<EntryWithInject> {
	// Firstly we need to insert the middleware array into the project,
	// and then we load the middleware - this insertion and loading is
	// different for each format.

	// Make sure we resolve all files relative to the actual temporary directory,
	// otherwise we'll have issues with source maps
	tmpDirPath = fs.realpathSync(tmpDirPath);

	const targetPathInsertion = path.join(
		tmpDirPath,
		"middleware-insertion.entry.js"
	);

	// We need to import each of the middlewares, so we need to generate a
	// random, unique identifier that we can use for the import.
	// Middlewares are required to be default exports so we can import to any name.
	const middlewareIdentifiers = middleware.map(
		(_, index) => `__MIDDLEWARE_${index}__`
	);

	const dynamicFacadePath = path.join(
		tmpDirPath,
		"middleware-insertion-facade.js"
	);

	if (entry.format === "modules") {
		// We use a facade to expose the required middleware alongside any user defined
		// middleware on the worker object

		const imports = middlewareIdentifiers
			.map((m) => `import ${m} from "${m}";`)
			.join("\n");

		// write a file with all of the imports required
		fs.writeFileSync(
			dynamicFacadePath,
			`import worker from "__ENTRY_POINT__";
			${imports}
			const facade = {
				...worker,
				middleware: [
					${middlewareIdentifiers.join(",")}${middlewareIdentifiers.length > 0 ? "," : ""}
					...(worker.middleware ? worker.middleware : []),
				]
			}
			export * from "__ENTRY_POINT__";
			export default facade;`
		);

		await esbuild.build({
			entryPoints: [dynamicFacadePath],
			bundle: true,
			sourcemap: true,
			format: "esm",
			plugins: [
				esbuildAliasExternalPlugin({
					__ENTRY_POINT__: entry.file,
					...Object.fromEntries(
						middleware.map((val, index) => [
							middlewareIdentifiers[index],
							toUrlPath(path.resolve(getBasePath(), val.path)),
						])
					),
				}),
			],
			outfile: targetPathInsertion,
		});

		let targetPathLoader = path.join(tmpDirPath, path.basename(entry.file));
		if (path.extname(entry.file) === "") targetPathLoader += ".js";
		const loaderPath = path.resolve(
			getBasePath(),
			"templates/middleware/loader-modules.ts"
		);
		await esbuild.build({
			entryPoints: [loaderPath],
			bundle: true,
			sourcemap: true,
			format: "esm",
			plugins: [
				esbuildAliasExternalPlugin({
					__ENTRY_POINT__: targetPathInsertion,
					"./common": path.resolve(
						getBasePath(),
						"templates/middleware/common.ts"
					),
				}),
			],
			outfile: targetPathLoader,
		});
		return {
			...entry,
			file: targetPathLoader,
		};
	} else {
		const imports = middlewareIdentifiers
			.map((m) => `import ${m} from "${m}";`)
			.join("\n");
		const contents = `import { __facade_registerInternal__ } from "__LOADER__";
			${imports}
			__facade_registerInternal__([${middlewareIdentifiers.join(",")}]);`;
		fs.writeFileSync(dynamicFacadePath, contents);

		await esbuild.build({
			entryPoints: [dynamicFacadePath],
			bundle: true,
			sourcemap: true,
			format: "iife",
			plugins: [
				{
					name: "dynamic-facade-imports",
					setup(build) {
						build.onResolve({ filter: /^__LOADER__$/ }, () => {
							const loaderPath = path.resolve(
								getBasePath(),
								"templates/middleware/loader-sw.ts"
							);
							return { path: loaderPath };
						});
						const middlewareFilter = /^__MIDDLEWARE_(\d+)__$/;
						build.onResolve({ filter: middlewareFilter }, (args) => {
							const match = middlewareFilter.exec(args.path);
							assert(match !== null);
							const middlewareIndex = parseInt(match[1]);
							return {
								path: path.resolve(
									getBasePath(),
									middleware[middlewareIndex].path
								),
							};
						});
					},
				},
			],
			outfile: targetPathInsertion,
		});
		return {
			...entry,
			inject: [targetPathInsertion],
		};
	}
}

/**
 * A middleware that serves static assets from a worker.
 * This powers --assets / config.assets
 */

async function applyStaticAssetFacade(
	entry: Entry,
	tmpDirPath: string,
	assets: StaticAssetsConfig
): Promise<Entry> {
	const targetPath = path.join(tmpDirPath, "serve-static-assets.entry.js");

	await esbuild.build({
		entryPoints: [
			path.resolve(getBasePath(), "templates/serve-static-assets.ts"),
		],
		bundle: true,
		format: "esm",
		sourcemap: true,
		plugins: [
			esbuildAliasExternalPlugin({
				__ENTRY_POINT__: entry.file,
				__KV_ASSET_HANDLER__: path.join(getBasePath(), "kv-asset-handler.js"),
				__STATIC_CONTENT_MANIFEST: "__STATIC_CONTENT_MANIFEST",
			}),
		],
		define: {
			__CACHE_CONTROL_OPTIONS__: JSON.stringify(
				typeof assets === "object"
					? {
							browserTTL:
								assets.browser_TTL || 172800 /* 2 days: 2* 60 * 60 * 24 */,
							bypassCache: assets.bypassCache,
					  }
					: {}
			),
			__SERVE_SINGLE_PAGE_APP__: JSON.stringify(
				typeof assets === "object" ? assets.serve_single_page_app : false
			),
		},
		outfile: targetPath,
	});

	return {
		...entry,
		file: targetPath,
	};
}

/**
 * A middleware that enables service bindings to be used in dev,
 * binding to other love wrangler dev instances
 */

async function applyMultiWorkerDevFacade(
	entry: Entry,
	tmpDirPath: string,
	services: Config["services"],
	workerDefinitions: WorkerRegistry
) {
	const targetPath = path.join(tmpDirPath, "multiworker-dev-facade.entry.js");
	const serviceMap = Object.fromEntries(
		(services || []).map((serviceBinding) => [
			serviceBinding.binding,
			workerDefinitions[serviceBinding.service] || null,
		])
	);

	await esbuild.build({
		entryPoints: [
			path.join(
				getBasePath(),
				entry.format === "modules"
					? "templates/service-bindings-module-facade.js"
					: "templates/service-bindings-sw-facade.js"
			),
		],
		bundle: true,
		sourcemap: true,
		format: "esm",
		plugins: [
			esbuildAliasExternalPlugin({
				__ENTRY_POINT__: entry.file,
			}),
		],
		define: {
			__WORKERS__: JSON.stringify(serviceMap),
		},
		outfile: targetPath,
	});

	return {
		...entry,
		file: targetPath,
	};
}

/**
 * A middleware that makes first party workers "work" in
 * our dev environments. Is applied during wrangler dev
 * when config.first_party_worker is true
 */
async function applyFirstPartyWorkerDevFacade(
	entry: Entry,
	tmpDirPath: string
) {
	if (entry.format !== "modules") {
		throw new Error(
			"First party workers must be in the modules format. See https://developers.cloudflare.com/workers/learning/migrating-to-module-workers/"
		);
	}

	const targetPath = path.join(
		tmpDirPath,
		"first-party-worker-module-facade.entry.js"
	);

	await esbuild.build({
		entryPoints: [
			path.resolve(
				getBasePath(),
				"templates/first-party-worker-module-facade.ts"
			),
		],
		bundle: true,
		format: "esm",
		sourcemap: true,
		plugins: [
			esbuildAliasExternalPlugin({
				__ENTRY_POINT__: entry.file,
			}),
		],
		outfile: targetPath,
	});

	return {
		...entry,
		file: targetPath,
	};
}

/**
 * A middleware that injects the beta D1 API in JS.
 *
 * This code be removed from here when the API is in Workers core,
 * but moved inside Miniflare for simulating D1.
 */

async function applyD1BetaFacade(
	entry: Entry,
	tmpDirPath: string,
	betaD1Shims: string[],
	local: boolean
): Promise<Entry> {
	const targetPath = path.join(tmpDirPath, "d1-beta-facade.entry.js");

	await esbuild.build({
		entryPoints: [path.resolve(getBasePath(), "templates/d1-beta-facade.js")],
		bundle: true,
		format: "esm",
		sourcemap: true,
		plugins: [
			esbuildAliasExternalPlugin({
				__ENTRY_POINT__: entry.file,
			}),
		],
		define: {
			__D1_IMPORTS__: JSON.stringify(betaD1Shims),
			__LOCAL_MODE__: JSON.stringify(local),
		},
		outfile: targetPath,
	});

	return {
		...entry,
		file: targetPath,
	};
}

/**
 * Generate a string that describes the entry-points that were identified by esbuild.
 */
function listEntryPoints(
	outputs: [string, ValueOf<esbuild.Metafile["outputs"]>][]
): string {
	return outputs.map(([_input, output]) => output.entryPoint).join("\n");
}

type ValueOf<T> = T[keyof T];
