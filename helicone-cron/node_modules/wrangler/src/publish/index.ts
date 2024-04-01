import path from "node:path";
import { findWranglerToml, readConfig } from "../config";
import { getEntry } from "../entry";
import {
	getRules,
	getScriptName,
	isLegacyEnv,
	printWranglerBanner,
} from "../index";
import { logger } from "../logger";
import * as metrics from "../metrics";
import { getAssetPaths, getSiteAssetPaths } from "../sites";
import { requireAuth } from "../user";
import { collectKeyValues } from "../utils/collectKeyValues";
import publish from "./publish";
import type { ConfigPath } from "../index";
import type {
	CommonYargsOptions,
	YargsOptionsToInterface,
} from "../yargs-types";
import type { Argv, ArgumentsCamelCase } from "yargs";

export function publishOptions(yargs: Argv<CommonYargsOptions>) {
	return (
		yargs
			.positional("script", {
				describe: "The path to an entry point for your worker",
				type: "string",
				requiresArg: true,
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
				describe: "Skip internal build steps and directly publish Worker",
				type: "boolean",
				default: false,
			})
			.option("outdir", {
				describe: "Output directory for the bundled worker",
				type: "string",
				requiresArg: true,
			})
			.option("format", {
				choices: ["modules", "service-worker"] as const,
				describe: "Choose an entry type",
				deprecated: true,
				hidden: true,
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
				default: false,
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
			.option("triggers", {
				describe: "cron schedules to attach",
				alias: ["schedule", "schedules"],
				type: "string",
				requiresArg: true,
				array: true,
			})
			.option("routes", {
				describe: "Routes to upload",
				alias: "route",
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
			.option("minify", {
				describe: "Minify the Worker",
				type: "boolean",
			})
			.option("node-compat", {
				describe: "Enable node.js compatibility",
				type: "boolean",
			})
			.option("dry-run", {
				describe: "Don't actually publish",
				type: "boolean",
			})
			.option("keep-vars", {
				describe:
					"Stop wrangler from deleting vars that are not present in the wrangler.toml\nBy default Wrangler will remove all vars and replace them with those found in the wrangler.toml configuration.\nIf your development approach is to modify vars after deployment via the dashboard you may wish to set this flag.",
				default: false,
				type: "boolean",
			})
			.option("legacy-env", {
				type: "boolean",
				describe: "Use legacy environments",
				hidden: true,
			})
			.option("logpush", {
				type: "boolean",
				describe:
					"Send Trace Events from this worker to Workers Logpush.\nThis will not configure a corresponding Logpush job automatically.",
			})
	);
}

type PublishArgs = YargsOptionsToInterface<typeof publishOptions>;

export async function publishHandler(args: ArgumentsCamelCase<PublishArgs>) {
	await printWranglerBanner();

	const configPath =
		(args.config as ConfigPath) ||
		(args.script && findWranglerToml(path.dirname(args.script)));
	const config = readConfig(configPath, args);
	const entry = await getEntry(args, config, "publish");
	await metrics.sendMetricsEvent(
		"deploy worker script",
		{
			usesTypeScript: /\.tsx?$/.test(entry.file),
		},
		{
			sendMetrics: config.send_metrics,
		}
	);

	if (args.public) {
		throw new Error("The --public field has been renamed to --assets");
	}
	if (args["experimental-public"]) {
		throw new Error(
			"The --experimental-public field has been renamed to --assets"
		);
	}

	if ((args.assets || config.assets) && (args.site || config.site)) {
		throw new Error("Cannot use Assets and Workers Sites in the same Worker.");
	}

	if (args.assets) {
		logger.warn(
			"The --assets argument is experimental and may change or break at any time"
		);
	}
	if (args.latest) {
		logger.warn(
			"Using the latest version of the Workers runtime. To silence this warning, please choose a specific version of the runtime with --compatibility-date, or add a compatibility_date to your wrangler.toml.\n"
		);
	}

	const cliVars = collectKeyValues(args.var);
	const cliDefines = collectKeyValues(args.define);

	const accountId = args.dryRun ? undefined : await requireAuth(config);

	const assetPaths =
		args.assets || config.assets
			? getAssetPaths(config, args.assets)
			: getSiteAssetPaths(
					config,
					args.site,
					args.siteInclude,
					args.siteExclude
			  );

	await publish({
		config,
		accountId,
		name: getScriptName(args, config),
		rules: getRules(config),
		entry,
		env: args.env,
		compatibilityDate: args.latest
			? new Date().toISOString().substring(0, 10)
			: args["compatibility-date"],
		compatibilityFlags: args["compatibility-flags"],
		vars: cliVars,
		defines: cliDefines,
		triggers: args.triggers,
		jsxFactory: args["jsx-factory"],
		jsxFragment: args["jsx-fragment"],
		tsconfig: args.tsconfig,
		routes: args.routes,
		assetPaths,
		legacyEnv: isLegacyEnv(config),
		minify: args.minify,
		nodeCompat: args.nodeCompat,
		isWorkersSite: Boolean(args.site || config.site),
		outDir: args.outdir,
		dryRun: args.dryRun,
		noBundle: !(args.bundle ?? !config.no_bundle),
		keepVars: args.keepVars,
		logpush: args.logpush,
	});
}
