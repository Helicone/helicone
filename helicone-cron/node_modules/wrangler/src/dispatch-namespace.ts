import { fetchResult } from "./cfetch";
import { readConfig } from "./config";
import { logger } from "./logger";
import * as metrics from "./metrics";
import { requireAuth } from "./user";
import { printWranglerBanner } from ".";
import type { ConfigPath } from ".";
import type { CommonYargsOptions } from "./yargs-types";
import type { Argv, CommandModule } from "yargs";

type Namespace = {
	namespace_id: string;
	namespace_name: string;
	created_on: string;
	created_by: string;
	modified_on: string;
	modified_by: string;
};

// Supporting Workers For Platforms
// More details at https://blog.cloudflare.com/workers-for-platforms/

/**
 * Create a dynamic dispatch namespace.
 */
async function createWorkerNamespace(accountId: string, name: string) {
	const namespace = await fetchResult<Namespace>(
		`/accounts/${accountId}/workers/dispatch/namespaces`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name }),
		}
	);
	logger.log(
		`Created dispatch namespace "${name}" with ID "${namespace.namespace_id}"`
	);
}

/**
 * Delete a dynamic dispatch namespace.
 */
async function deleteWorkerNamespace(accountId: string, name: string) {
	await fetchResult(
		`/accounts/${accountId}/workers/dispatch/namespaces/${name}`,
		{ method: "DELETE" }
	);
	logger.log(`Deleted dispatch namespace "${name}"`);
}

/**
 * List all created dynamic dispatch namespaces for an account
 */
async function listWorkerNamespaces(accountId: string) {
	logger.log(
		await fetchResult<Namespace>(
			`/accounts/${accountId}/workers/dispatch/namespaces`,
			{
				headers: {
					"Content-Type": "application/json",
				},
			}
		)
	);
}

/**
 * Get info for a specific dynamic dispatch namespace
 */
async function getWorkerNamespaceInfo(accountId: string, name: string) {
	logger.log(
		await fetchResult<Namespace>(
			`/accounts/${accountId}/workers/dispatch/namespaces/${name}`,
			{
				headers: {
					"Content-Type": "application/json",
				},
			}
		)
	);
}

/**
 * Rename a dynamic dispatch namespace
 */
async function renameWorkerNamespace(
	accountId: string,
	oldName: string,
	newName: string
) {
	printWranglerBanner();

	await fetchResult(
		`/accounts/${accountId}/workers/dispatch/namespaces/${oldName}`,
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name: newName }),
		}
	);
	logger.log(`Renamed dispatch namespace "${oldName}" to "${newName}"`);
}

export function workerNamespaceCommands(
	workerNamespaceYargs: Argv<CommonYargsOptions>,
	subHelp: CommandModule<CommonYargsOptions, CommonYargsOptions>
) {
	return workerNamespaceYargs
		.command(subHelp)
		.command("list", "List all dispatch namespaces", {}, async (args) => {
			const config = readConfig(args.config as ConfigPath, args);
			const accountId = await requireAuth(config);
			await listWorkerNamespaces(accountId);
			await metrics.sendMetricsEvent("list dispatch namespaces", {
				sendMetrics: config.send_metrics,
			});
		})
		.command(
			"get <name>",
			"Get information about a dispatch namespace",
			(yargs) => {
				return yargs.positional("name", {
					describe: "Name of the dispatch namespace",
					type: "string",
					demandOption: true,
				});
			},
			async (args) => {
				const config = readConfig(args.config as ConfigPath, args);
				const accountId = await requireAuth(config);
				await getWorkerNamespaceInfo(accountId, args.name);
				await metrics.sendMetricsEvent("view dispatch namespace", {
					sendMetrics: config.send_metrics,
				});
			}
		)
		.command(
			"create <name>",
			"Create a dispatch namespace",
			(yargs) => {
				return yargs.positional("name", {
					describe: "Name of the dispatch namespace",
					type: "string",
					demandOption: true,
				});
			},
			async (args) => {
				await printWranglerBanner();
				const config = readConfig(args.config as ConfigPath, args);
				const accountId = await requireAuth(config);
				await createWorkerNamespace(accountId, args.name);
				await metrics.sendMetricsEvent("create dispatch namespace", {
					sendMetrics: config.send_metrics,
				});
			}
		)
		.command(
			"delete <name>",
			"Delete a dispatch namespace",
			(yargs) => {
				return yargs.positional("name", {
					describe: "Name of the dispatch namespace",
					type: "string",
					demandOption: true,
				});
			},
			async (args) => {
				await printWranglerBanner();
				const config = readConfig(args.config as ConfigPath, args);
				const accountId = await requireAuth(config);
				await deleteWorkerNamespace(accountId, args.name);
				await metrics.sendMetricsEvent("delete dispatch namespace", {
					sendMetrics: config.send_metrics,
				});
			}
		)
		.command(
			"rename <old-name> <new-name>",
			"Rename a dispatch namespace",
			(yargs) => {
				return yargs
					.positional("old-name", {
						describe: "Name of the dispatch namespace",
						type: "string",
						demandOption: true,
					})
					.positional("new-name", {
						describe: "New name of the dispatch namespace",
						type: "string",
						demandOption: true,
					});
			},
			async (args) => {
				await printWranglerBanner();
				const config = readConfig(args.config as ConfigPath, args);
				const accountId = await requireAuth(config);
				await renameWorkerNamespace(accountId, args.oldName, args.newName);
				await metrics.sendMetricsEvent("rename dispatch namespace", {
					sendMetrics: config.send_metrics,
				});
			}
		);
}
