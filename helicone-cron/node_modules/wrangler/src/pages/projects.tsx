import { execSync } from "node:child_process";
import { render } from "ink";
import Table from "ink-table";
import React from "react";
import { format as timeagoFormat } from "timeago.js";
import { fetchResult } from "../cfetch";
import { getConfigCache, saveToConfigCache } from "../config-cache";
import { prompt } from "../dialogs";
import { FatalError } from "../errors";
import { logger } from "../logger";
import * as metrics from "../metrics";
import { requireAuth } from "../user";
import { PAGES_CONFIG_CACHE_FILENAME } from "./constants";
import { pagesBetaWarning } from "./utils";
import type { PagesConfigCache, Project } from "./types";
import type { ArgumentsCamelCase, Argv } from "yargs";

// Empty object, as per eslint
type ListArgs = Record<string, never>;

export function ListOptions(yargs: Argv): Argv<ListArgs> {
	return yargs.epilogue(pagesBetaWarning);
}

export async function ListHandler() {
	const config = getConfigCache<PagesConfigCache>(PAGES_CONFIG_CACHE_FILENAME);

	const accountId = await requireAuth(config);

	const projects: Array<Project> = await listProjects({ accountId });

	const data = projects.map((project) => {
		return {
			"Project Name": project.name,
			"Project Domains": `${project.domains.join(", ")}`,
			"Git Provider": project.source ? "Yes" : "No",
			"Last Modified": project.latest_deployment
				? timeagoFormat(project.latest_deployment.modified_on)
				: timeagoFormat(project.created_on),
		};
	});

	saveToConfigCache<PagesConfigCache>(PAGES_CONFIG_CACHE_FILENAME, {
		account_id: accountId,
	});

	const { unmount } = render(<Table data={data}></Table>, {
		patchConsole: false,
	});
	unmount();
	await metrics.sendMetricsEvent("list pages projects");
}

export const listProjects = async ({
	accountId,
}: {
	accountId: string;
}): Promise<Array<Project>> => {
	const pageSize = 10;
	let page = 1;
	const results = [];
	while (results.length % pageSize === 0) {
		const json: Array<Project> = await fetchResult(
			`/accounts/${accountId}/pages/projects`,
			{},
			new URLSearchParams({
				per_page: pageSize.toString(),
				page: page.toString(),
			})
		);
		page++;
		results.push(...json);
		if (json.length < pageSize) {
			break;
		}
	}
	return results;
};

type CreateArgs = {
	"project-name": string;
	"production-branch"?: string;
};

export function CreateOptions(yargs: Argv): Argv<CreateArgs> {
	return yargs
		.positional("project-name", {
			type: "string",
			demandOption: true,
			description: "The name of your Pages project",
		})
		.options({
			"production-branch": {
				type: "string",
				description: "The name of the production branch of your project",
			},
		})
		.epilogue(pagesBetaWarning);
}

export async function CreateHandler({
	productionBranch,
	projectName,
}: ArgumentsCamelCase<CreateArgs>) {
	const config = getConfigCache<PagesConfigCache>(PAGES_CONFIG_CACHE_FILENAME);
	const accountId = await requireAuth(config);

	const isInteractive = process.stdin.isTTY;
	if (!projectName && isInteractive) {
		projectName = await prompt("Enter the name of your new project:");
	}

	if (!projectName) {
		throw new FatalError("Must specify a project name.", 1);
	}

	if (!productionBranch && isInteractive) {
		let isGitDir = true;
		try {
			execSync(`git rev-parse --is-inside-work-tree`, {
				stdio: "ignore",
			});
		} catch (err) {
			isGitDir = false;
		}

		if (isGitDir) {
			try {
				productionBranch = execSync(`git rev-parse --abbrev-ref HEAD`)
					.toString()
					.trim();
			} catch (err) {}
		}

		productionBranch = await prompt(
			"Enter the production branch name:",
			"text",
			productionBranch ?? "production"
		);
	}

	if (!productionBranch) {
		throw new FatalError("Must specify a production branch.", 1);
	}

	const { subdomain } = await fetchResult<Project>(
		`/accounts/${accountId}/pages/projects`,
		{
			method: "POST",
			body: JSON.stringify({
				name: projectName,
				production_branch: productionBranch,
			}),
		}
	);

	saveToConfigCache<PagesConfigCache>(PAGES_CONFIG_CACHE_FILENAME, {
		account_id: accountId,
		project_name: projectName,
	});

	logger.log(
		`✨ Successfully created the '${projectName}' project. It will be available at https://${subdomain}/ once you create your first deployment.`
	);
	logger.log(
		`To deploy a folder of assets, run 'wrangler pages publish [directory]'.`
	);
	await metrics.sendMetricsEvent("create pages project");
}
