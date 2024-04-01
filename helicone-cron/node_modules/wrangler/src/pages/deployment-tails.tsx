import { setTimeout } from "node:timers/promises";
import onExit from "signal-exit";
import { printWranglerBanner } from "..";
import { fetchResult } from "../cfetch";
import { readConfig } from "../config";
import { getConfigCache } from "../config-cache";
import { FatalError } from "../errors";
import isInteractive from "../is-interactive";
import { logger } from "../logger";
import * as metrics from "../metrics";
import {
	jsonPrintLogs,
	prettyPrintLogs,
	createPagesTail,
} from "../tail/createTail";
import { translateCLICommandToFilterMessage } from "../tail/filters";
import { requireAuth } from "../user";
import { PAGES_CONFIG_CACHE_FILENAME } from "./constants";
import { promptSelectProject } from "./prompt-select-project";
import { isUrl } from "./utils";
import type { ConfigPath } from "..";
import type { YargsOptionsToInterface } from "../yargs-types";
import type { Deployment, PagesConfigCache } from "./types";
import type { Argv } from "yargs";

type Options = YargsOptionsToInterface<typeof Options> & {
	// Global flag
	config?: string;
};
const statusChoices = ["ok", "error", "canceled"] as const;
type StatusChoice = typeof statusChoices[number];
const isStatusChoiceList = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data?: any[]
): data is StatusChoice[] =>
	data?.every((d) => statusChoices.includes(d)) ?? false;

export function Options(yargs: Argv) {
	return (
		yargs
			.positional("deployment", {
				type: "string",
				description:
					"(Optional) ID or URL of the deployment to tail. " +
					"Specify by environment if deployment ID is unknown.",
			})
			.options({
				"project-name": {
					type: "string",
					description: "The name of the project you would like to tail",
				},
				environment: {
					type: "string",
					choices: ["production", "preview"],
					default: "production",
					description:
						"When not providing a specific deployment ID, " +
						"specifying environment will grab the latest production or " +
						"preview deployment",
				},
			})
			.option("format", {
				default: process.stdout.isTTY ? "pretty" : "json",
				choices: ["json", "pretty"],
				describe: "The format of log entries",
			})
			.option("debug", {
				type: "boolean",
				hidden: true,
				default: false,
				describe:
					"If a log would have been filtered out, send it through " +
					"anyway alongside the filter which would have blocked it.",
			})
			// Tail filters;
			.option("status", {
				choices: statusChoices,
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
			.option("search", {
				type: "string",
				requiresArg: true,
				describe: "Filter by a text match in console.log messages",
			})
			.option("sampling-rate", {
				type: "number",
				describe: "Adds a percentage of requests to log sampling rate",
			})
			.option("ip", {
				type: "string",
				requiresArg: true,
				describe:
					"Filter by the IP address the request originates from. Use " +
					'"self" to filter for your own IP',
				array: true,
			})
	);
}

export async function Handler({
	deployment,
	projectName,
	environment,
	header,
	ip: clientIp,
	method,
	samplingRate,
	search,
	status,
	format = "pretty",
	debug,
	...args
}: Options) {
	if (status && !isStatusChoiceList(status)) {
		throw new FatalError(
			"Invalid value for `--status`. Valid options: " + statusChoices.join(", ")
		);
	}

	if (format === "pretty") {
		await printWranglerBanner();
	}

	const config = readConfig(args.config as ConfigPath, args);
	const pagesConfig = getConfigCache<PagesConfigCache>(
		PAGES_CONFIG_CACHE_FILENAME
	);
	const accountId = await requireAuth(pagesConfig);
	let deploymentId = deployment;

	if (!isInteractive()) {
		if (!deploymentId) {
			throw new FatalError(
				"Must specify a deployment in non-interactive mode.",
				1
			);
		}

		if (!projectName) {
			throw new FatalError(
				"Must specify a project name in non-interactive mode.",
				1
			);
		}
	}

	if (!projectName && isInteractive()) {
		projectName = await promptSelectProject({ accountId });
	}

	if (!deployment && !projectName) {
		throw new FatalError("Must specify a project name or deployment.", 1);
	}

	const deployments: Array<Deployment> = await fetchResult(
		`/accounts/${accountId}/pages/projects/${projectName}/deployments`
	);

	const envDeployments = deployments.filter(
		(d) => d.environment === environment
	);

	// Deployment is URL
	if (isUrl(deployment)) {
		const { hostname: deploymentHostname } = new URL(deployment);
		const targetDeployment = envDeployments.find(
			(d) => new URL(d.url).hostname === deploymentHostname
		);

		if (!targetDeployment) {
			throw new FatalError(
				"Could not find deployment match url: " + deployment,
				1
			);
		}

		deploymentId = targetDeployment.id;
	} else if (!deployment) {
		if (envDeployments.length === 0) {
			throw new FatalError("No deployments for environment: " + environment, 1);
		}

		if (format === "pretty") {
			logger.log(
				"No deployment specified. Using latest deployment for",
				environment,
				"environment."
			);
		}

		const latestDeployment = envDeployments
			.map((d) => ({ id: d.id, created_on: new Date(d.created_on) }))
			.sort((a, b) => +b.created_on - +a.created_on)[0];

		deploymentId = latestDeployment.id;
	}

	if (!deploymentId || !projectName) {
		throw new FatalError("An unknown error occurred.", 1);
	}

	const filters = translateCLICommandToFilterMessage({
		header,
		clientIp,
		method,
		samplingRate,
		search,
		status,
	});

	await metrics.sendMetricsEvent("begin pages log stream", {
		sendMetrics: config.send_metrics,
	});

	const { tail, deleteTail } = await createPagesTail({
		accountId,
		projectName,
		deploymentId,
		filters,
		debug,
	});

	const onCloseTail = (() => {
		let didTerminate = false;

		return async () => {
			if (didTerminate) return;

			tail.terminate();
			await deleteTail();
			await metrics.sendMetricsEvent("end pages log stream", {
				sendMetrics: config.send_metrics,
			});

			didTerminate = true;
		};
	})();

	onExit(onCloseTail);

	tail.on("message", (data) => {
		if (format === "pretty") {
			prettyPrintLogs(data);
		} else {
			jsonPrintLogs(data);
		}
	});

	tail.on("close", onCloseTail);

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
					`Connection to deployment ${deploymentId} closed unexpectedly.`
				);
		}
	}

	if (format === "pretty") {
		logger.log(`Connected to deployment ${deploymentId}, waiting for logs...`);
	}
}
