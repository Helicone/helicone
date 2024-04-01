import { render } from "ink";
import Table from "ink-table";
import React from "react";
import { format as timeagoFormat } from "timeago.js";
import { fetchResult } from "../cfetch";
import { getConfigCache, saveToConfigCache } from "../config-cache";
import { FatalError } from "../errors";
import * as metrics from "../metrics";
import { requireAuth } from "../user";
import { PAGES_CONFIG_CACHE_FILENAME } from "./constants";
import { promptSelectProject } from "./prompt-select-project";
import { pagesBetaWarning } from "./utils";
import type { YargsOptionsToInterface } from "../yargs-types";
import type { Deployment, PagesConfigCache } from "./types";
import type { Argv } from "yargs";

type ListArgs = YargsOptionsToInterface<typeof ListOptions>;

export function ListOptions(yargs: Argv) {
	return yargs
		.options({
			"project-name": {
				type: "string",
				description:
					"The name of the project you would like to list deployments for",
			},
		})
		.epilogue(pagesBetaWarning);
}

export async function ListHandler({ projectName }: ListArgs) {
	const config = getConfigCache<PagesConfigCache>(PAGES_CONFIG_CACHE_FILENAME);
	const accountId = await requireAuth(config);

	projectName ??= config.project_name;

	const isInteractive = process.stdin.isTTY;
	if (!projectName && isInteractive) {
		projectName = await promptSelectProject({ accountId });
	}

	if (!projectName) {
		throw new FatalError("Must specify a project name.", 1);
	}

	const deployments: Array<Deployment> = await fetchResult(
		`/accounts/${accountId}/pages/projects/${projectName}/deployments`
	);

	const titleCase = (word: string) =>
		word.charAt(0).toUpperCase() + word.slice(1);

	const shortSha = (sha: string) => sha.slice(0, 7);

	const getStatus = (deployment: Deployment) => {
		// Return a pretty time since timestamp if successful otherwise the status
		if (deployment.latest_stage.status === `success`) {
			return timeagoFormat(deployment.latest_stage.ended_on);
		}
		return titleCase(deployment.latest_stage.status);
	};

	const data = deployments.map((deployment) => {
		return {
			Environment: titleCase(deployment.environment),
			Branch: deployment.deployment_trigger.metadata.branch,
			Source: shortSha(deployment.deployment_trigger.metadata.commit_hash),
			Deployment: deployment.url,
			Status: getStatus(deployment),
			// TODO: Use a url shortener
			Build: `https://dash.cloudflare.com/${accountId}/pages/view/${deployment.project_name}/${deployment.id}`,
		};
	});

	saveToConfigCache<PagesConfigCache>(PAGES_CONFIG_CACHE_FILENAME, {
		account_id: accountId,
	});

	const { unmount } = render(<Table data={data}></Table>, {
		patchConsole: false,
	});
	unmount();
	await metrics.sendMetricsEvent("list pages deployments");
}
