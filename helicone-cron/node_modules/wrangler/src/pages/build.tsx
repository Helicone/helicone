import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { FatalError } from "../errors";
import { logger } from "../logger";
import * as metrics from "../metrics";
import { toUrlPath } from "../paths";
import { isInPagesCI } from "./constants";
import {
	EXIT_CODE_FUNCTIONS_NO_ROUTES_ERROR,
	FunctionsNoRoutesError,
	getFunctionsNoRoutesWarning,
} from "./errors";
import { buildPlugin } from "./functions/buildPlugin";
import { buildWorker } from "./functions/buildWorker";
import { generateConfigFromFileTree } from "./functions/filepath-routing";
import { writeRoutesModule } from "./functions/routes";
import { convertRoutesToRoutesJSONSpec } from "./functions/routes-transformation";
import { pagesBetaWarning, RUNNING_BUILDERS } from "./utils";
import type { YargsOptionsToInterface } from "../yargs-types";
import type { Config } from "./functions/routes";
import type { Argv } from "yargs";

type PagesBuildArgs = YargsOptionsToInterface<typeof Options>;

export function Options(yargs: Argv) {
	return yargs
		.positional("directory", {
			type: "string",
			default: "functions",
			description: "The directory of Pages Functions",
		})
		.options({
			outfile: {
				type: "string",
				default: "_worker.js",
				description: "The location of the output Worker script",
			},
			"output-config-path": {
				type: "string",
				description: "The location for the output config file",
			},
			"output-routes-path": {
				type: "string",
				description: "The location for the output _routes.json file",
			},
			minify: {
				type: "boolean",
				default: false,
				description: "Minify the output Worker script",
			},
			sourcemap: {
				type: "boolean",
				default: false,
				description: "Generate a sourcemap for the output Worker script",
			},
			"fallback-service": {
				type: "string",
				default: "ASSETS",
				description:
					"The service to fallback to at the end of the `next` chain. Setting to '' will fallback to the global `fetch`.",
			},
			watch: {
				type: "boolean",
				default: false,
				description:
					"Watch for changes to the functions and automatically rebuild the Worker script",
			},
			plugin: {
				type: "boolean",
				default: false,
				description: "Build a plugin rather than a Worker script",
			},
			"build-output-directory": {
				type: "string",
				description: "The directory to output static assets to",
			},
			"node-compat": {
				describe: "Enable node.js compatibility",
				default: false,
				type: "boolean",
				hidden: true,
			},
			bindings: {
				type: "string",
				describe:
					"Bindings used in Functions (used to register beta product shims)",
				deprecated: true,
				hidden: true,
			},
		})
		.epilogue(pagesBetaWarning);
}

export const Handler = async ({
	directory,
	outfile,
	outputConfigPath,
	outputRoutesPath: routesOutputPath,
	minify,
	sourcemap,
	fallbackService,
	watch,
	plugin,
	buildOutputDirectory,
	nodeCompat,
	bindings,
}: PagesBuildArgs) => {
	if (!isInPagesCI) {
		// Beta message for `wrangler pages <commands>` usage
		logger.log(pagesBetaWarning);
	}

	if (nodeCompat) {
		console.warn(
			"Enabling node.js compatibility mode for builtins and globals. This is experimental and has serious tradeoffs. Please see https://github.com/ionic-team/rollup-plugin-node-polyfills/ for more details."
		);
	}

	let d1Databases: string[] | undefined = undefined;
	if (bindings) {
		try {
			const decodedBindings = JSON.parse(bindings);
			d1Databases = Object.keys(decodedBindings?.d1_databases || {});
		} catch {
			throw new FatalError("Could not parse a valid set of 'bindings'.", 1);
		}
	}

	buildOutputDirectory ??= dirname(outfile);
	try {
		await buildFunctions({
			outfile,
			outputConfigPath,
			functionsDirectory: directory,
			minify,
			sourcemap,
			fallbackService,
			watch,
			plugin,
			buildOutputDirectory,
			nodeCompat,
			routesOutputPath,
			local: false,
			d1Databases,
		});
	} catch (e) {
		if (e instanceof FunctionsNoRoutesError) {
			throw new FatalError(
				getFunctionsNoRoutesWarning(directory),
				EXIT_CODE_FUNCTIONS_NO_ROUTES_ERROR
			);
		} else {
			throw e;
		}
	}
	await metrics.sendMetricsEvent("build pages functions");
};

/**
 * Builds a Functions worker based on the functions directory, with filepath and handler based routing.
 * @throws FunctionsNoRoutesError when there are no routes found in the functions directory
 */
export async function buildFunctions({
	outfile,
	outputConfigPath,
	functionsDirectory,
	minify = false,
	sourcemap = false,
	fallbackService = "ASSETS",
	watch = false,
	onEnd,
	plugin = false,
	buildOutputDirectory,
	routesOutputPath,
	nodeCompat,
	local,
	d1Databases,
}: Partial<
	Pick<
		PagesBuildArgs,
		| "outputConfigPath"
		| "minify"
		| "sourcemap"
		| "fallbackService"
		| "watch"
		| "plugin"
		| "buildOutputDirectory"
		| "nodeCompat"
	>
> & {
	functionsDirectory: string;
	onEnd?: () => void;
	outfile: Required<PagesBuildArgs>["outfile"];
	routesOutputPath?: PagesBuildArgs["outputRoutesPath"];
	local: boolean;
	d1Databases?: string[];
}) {
	RUNNING_BUILDERS.forEach(
		(runningBuilder) => runningBuilder.stop && runningBuilder.stop()
	);

	const routesModule = join(tmpdir(), `./functionsRoutes-${Math.random()}.mjs`);
	const baseURL = toUrlPath("/");

	const config: Config = await generateConfigFromFileTree({
		baseDir: functionsDirectory,
		baseURL,
	});

	if (!config.routes || config.routes.length === 0) {
		throw new FunctionsNoRoutesError(
			`Failed to find any routes while compiling Functions in: ${functionsDirectory}`
		);
	}

	if (routesOutputPath) {
		const routesJSON = convertRoutesToRoutesJSONSpec(config.routes);
		writeFileSync(routesOutputPath, JSON.stringify(routesJSON, null, 2));
	}

	if (outputConfigPath) {
		writeFileSync(
			outputConfigPath,
			JSON.stringify({ ...config, baseURL }, null, 2)
		);
	}

	await writeRoutesModule({
		config,
		srcDir: functionsDirectory,
		outfile: routesModule,
	});

	const absoluteFunctionsDirectory = resolve(functionsDirectory);

	if (plugin) {
		RUNNING_BUILDERS.push(
			await buildPlugin({
				routesModule,
				outfile,
				minify,
				sourcemap,
				watch,
				nodeCompat,
				functionsDirectory: absoluteFunctionsDirectory,
				local,
				betaD1Shims: d1Databases,
				onEnd,
			})
		);
	} else {
		RUNNING_BUILDERS.push(
			await buildWorker({
				routesModule,
				outfile,
				minify,
				sourcemap,
				fallbackService,
				watch,
				functionsDirectory: absoluteFunctionsDirectory,
				local,
				betaD1Shims: d1Databases,
				onEnd,
				buildOutputDirectory,
				nodeCompat,
			})
		);
	}
}
