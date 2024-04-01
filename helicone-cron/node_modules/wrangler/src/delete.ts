import assert from "assert";
import path from "path";
import { fetchResult } from "./cfetch";
import { findWranglerToml, readConfig } from "./config";
import { confirm } from "./dialogs";
import { CI } from "./is-ci";
import isInteractive from "./is-interactive";
import { deleteKVNamespace, listKVNamespaces } from "./kv/helpers";
import { logger } from "./logger";
import * as metrics from "./metrics";
import { requireAuth } from "./user";
import { getScriptName, printWranglerBanner } from "./index";
import type { ConfigPath } from "./index";
import type {
	CommonYargsOptions,
	YargsOptionsToInterface,
} from "./yargs-types";
import type { Argv } from "yargs";

export function deleteOptions(yargs: Argv<CommonYargsOptions>) {
	return yargs
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
		.option("dry-run", {
			describe: "Don't actually delete",
			type: "boolean",
		})
		.option("legacy-env", {
			type: "boolean",
			describe: "Use legacy environments",
			hidden: true,
		});
}

type DeleteArgs = YargsOptionsToInterface<typeof deleteOptions>;

export async function deleteHandler(args: DeleteArgs) {
	await printWranglerBanner();

	const configPath =
		(args.config as ConfigPath) ||
		(args.script && findWranglerToml(path.dirname(args.script)));
	const config = readConfig(configPath, args);
	await metrics.sendMetricsEvent(
		"delete worker script",
		{},
		{ sendMetrics: config.send_metrics }
	);

	const accountId = args.dryRun ? undefined : await requireAuth(config);

	const scriptName = getScriptName(args, config);

	assert(
		scriptName,
		"A worker name must be defined, either via --name, or in wrangler.toml"
	);

	if (args.dryRun) {
		logger.log(`--dry-run: exiting now.`);
		return;
	}

	assert(accountId, "Missing accountId");

	let confirmed = true;
	if (isInteractive() || !CI.isCI()) {
		confirmed = await confirm(
			`Are you sure you want to delete ${scriptName}? This action cannot be undone.`
		);
	}

	if (confirmed) {
		await fetchResult(
			`/accounts/${accountId}/workers/services/${scriptName}`,
			{ method: "DELETE" },
			new URLSearchParams({ force: "true" })
		);

		await deleteSiteNamespaceIfExisting(scriptName, accountId);

		logger.log("Successfully deleted", scriptName);
	}
}

async function deleteSiteNamespaceIfExisting(
	scriptName: string,
	accountId: string
): Promise<void> {
	const title = `__${scriptName}-workers_sites_assets`;
	const previewTitle = `__${scriptName}-workers_sites_assets_preview`;
	const allNamespaces = await listKVNamespaces(accountId);
	const namespacesToDelete = allNamespaces.filter(
		(ns) => ns.title === title || ns.title === previewTitle
	);
	for (const ns of namespacesToDelete) {
		await deleteKVNamespace(accountId, ns.id);
		logger.log(`🌀 Deleted asset namespace for Workers Site "${ns.title}"`);
	}
}
