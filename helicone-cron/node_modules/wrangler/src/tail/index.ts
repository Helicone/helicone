import { setTimeout } from "node:timers/promises";
import onExit from "signal-exit";

import { fetchResult, fetchScriptContent } from "../cfetch";
import { readConfig } from "../config";
import { tailDOLogPrompt } from "../dialogs";
import {
	isLegacyEnv,
	printWranglerBanner,
	getLegacyScriptName,
} from "../index";
import { logger } from "../logger";
import * as metrics from "../metrics";
import { requireAuth } from "../user";
import { getWorkerForZone } from "../zones";
import {
	createTail,
	jsonPrintLogs,
	prettyPrintLogs,
	translateCLICommandToFilterMessage,
} from "./createTail";
import type { WorkerMetadata } from "../create-worker-upload-form";
import type { ConfigPath } from "../index";
import type {
	CommonYargsOptions,
	YargsOptionsToInterface,
} from "../yargs-types";
import type { TailCLIFilters } from "./createTail";
import type { RawData } from "ws";
import type { Argv } from "yargs";

export function tailOptions(yargs: Argv<CommonYargsOptions>) {
	return yargs
		.positional("worker", {
			describe: "Name or route of the worker to tail",
			type: "string",
		})
		.option("format", {
			default: process.stdout.isTTY ? "pretty" : "json",
			choices: ["json", "pretty"],
			describe: "The format of log entries",
		})
		.option("status", {
			choices: ["ok", "error", "canceled"],
			describe: "Filter by invocation status",
			array: true,
		})
		.option("header", {
			type: "string",
			requiresArg: true,
			describe: "Filter by HTTP header",
		})
		.option("method", {
			type: "string",
			requiresArg: true,
			describe: "Filter by HTTP method",
			array: true,
		})
		.option("sampling-rate", {
			type: "number",
			describe: "Adds a percentage of requests to log sampling rate",
		})
		.option("search", {
			type: "string",
			requiresArg: true,
			describe: "Filter by a text match in console.log messages",
		})
		.option("ip", {
			type: "string",
			requiresArg: true,
			describe:
				'Filter by the IP address the request originates from. Use "self" to filter for your own IP',
			array: true,
		})
		.option("debug", {
			type: "boolean",
			hidden: true,
			default: false,
			describe:
				"If a log would have been filtered out, send it through anyway alongside the filter which would have blocked it.",
		})
		.option("legacy-env", {
			type: "boolean",
			describe: "Use legacy environments",
			hidden: true,
		});
}

type TailArgs = YargsOptionsToInterface<typeof tailOptions>;

export async function tailHandler(args: TailArgs) {
	if (args.format === "pretty") {
		await printWranglerBanner();
	}
	const config = readConfig(args.config as ConfigPath, args);
	await metrics.sendMetricsEvent("begin log stream", {
		sendMetrics: config.send_metrics,
	});

	let scriptName;

	// Worker names can't contain "." (and most routes should), so use that as a discriminator
	if (args.worker?.includes(".")) {
		scriptName = await getWorkerForZone(args.worker);
		if (args.format === "pretty") {
			logger.log(`Connecting to worker ${scriptName} at route ${args.worker}`);
		}
	} else {
		scriptName = getLegacyScriptName({ name: args.worker, ...args }, config);
	}

	if (!scriptName) {
		throw new Error(
			"Required Worker name missing. Please specify the Worker name in wrangler.toml, or pass it as an argument with `wrangler tail <worker-name>`"
		);
	}

	const accountId = await requireAuth(config);

	const cliFilters: TailCLIFilters = {
		status: args.status as ("ok" | "error" | "canceled")[] | undefined,
		header: args.header,
		method: args.method,
		samplingRate: args["sampling-rate"],
		search: args.search,
		clientIp: args.ip,
	};
	const scriptContent: string = await fetchScriptContent(
		(!isLegacyEnv(config) ? args.env : undefined)
			? `/accounts/${accountId}/workers/services/${scriptName}/environments/${args.env}/content`
			: `/accounts/${accountId}/workers/scripts/${scriptName}`
	);

	const bindings = await fetchResult<WorkerMetadata["bindings"]>(
		(!isLegacyEnv(config) ? args.env : undefined)
			? `/accounts/${accountId}/workers/services/${scriptName}/environments/${args.env}/bindings`
			: `/accounts/${accountId}/workers/scripts/${scriptName}/bindings`
	);
	if (
		scriptContent.toLowerCase().includes("websocket") &&
		bindings.find((b) => b.type === "durable_object_namespace")
	) {
		logger.warn(
			`Beginning log collection requires restarting the Durable Objects associated with ${scriptName}. Any WebSocket connections or other non-persisted state will be lost as part of this restart.`
		);

		const shouldContinue = await tailDOLogPrompt();
		if (!shouldContinue) {
			return;
		}
	}
	const filters = translateCLICommandToFilterMessage(cliFilters);

	const { tail, expiration, deleteTail } = await createTail(
		accountId,
		scriptName,
		filters,
		args.debug,
		!isLegacyEnv(config) ? args.env : undefined
	);

	const scriptDisplayName = `${scriptName}${
		args.env && !isLegacyEnv(config) ? ` (${args.env})` : ""
	}`;

	if (args.format === "pretty") {
		logger.log(
			`Successfully created tail, expires at ${expiration.toLocaleString()}`
		);
	}

	onExit(async () => {
		tail.terminate();
		await deleteTail();
		await metrics.sendMetricsEvent("end log stream", {
			sendMetrics: config.send_metrics,
		});
	});

	const printLog: (data: RawData) => void =
		args.format === "pretty" ? prettyPrintLogs : jsonPrintLogs;

	tail.on("message", printLog);

	while (tail.readyState !== tail.OPEN) {
		switch (tail.readyState) {
			case tail.CONNECTING:
				await setTimeout(100);
				break;
			case tail.CLOSING:
				await setTimeout(100);
				break;
			case tail.CLOSED:
				await metrics.sendMetricsEvent("end log stream", {
					sendMetrics: config.send_metrics,
				});
				throw new Error(
					`Connection to ${scriptDisplayName} closed unexpectedly.`
				);
		}
	}

	if (args.format === "pretty") {
		logger.log(`Connected to ${scriptDisplayName}, waiting for logs...`);
	}

	tail.on("close", async () => {
		tail.terminate();
		await deleteTail();
		await metrics.sendMetricsEvent("end log stream", {
			sendMetrics: config.send_metrics,
		});
	});
}
