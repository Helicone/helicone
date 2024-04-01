import { URLSearchParams } from "url";
import { fetchResult } from "./cfetch";
import { logger } from "./logger";
import type { ServiceMetadataRes } from "./init";

export type DeploymentListRes = {
	latest: {
		id: string;
		number: string;
		metadata: {
			author_id: string;
			author_email: string;
			source: "api" | "dash" | "wrangler" | "terraform" | "other";
			created_on: string;
			modified_on: string;
		};
		resources: {
			script: string;
			bindings: unknown[];
		};
	};
	items: {
		id: string;
		number: string;
		metadata: {
			author_id: string;
			author_email: string;
			source: "api" | "dash" | "wrangler" | "terraform" | "other";
			created_on: string;
			modified_on: string;
		};
	}[];
};

export async function deployments(
	accountId: string,
	scriptName: string | undefined
) {
	const scriptMetadata = await fetchResult<ServiceMetadataRes>(
		`/accounts/${accountId}/workers/services/${scriptName}`
	);

	const scriptTag = scriptMetadata.default_environment.script.tag;
	const params = new URLSearchParams({ order: "asc" });
	const { items: deploys } = await fetchResult<DeploymentListRes>(
		`/accounts/${accountId}/workers/deployments/by-script/${scriptTag}`,
		undefined,
		params
	);

	const versionMessages = deploys.map(
		(versions) =>
			`\nDeployment ID: ${versions.id}
Created on: ${versions.metadata.created_on}
Author: ${versions.metadata.author_email}
Source: ${sourceStr(versions.metadata.source)}\n`
	);

	versionMessages[versionMessages.length - 1] += "🟩 Active";
	logger.log(...versionMessages);
}

// TODO Include emoji/icon for each source
function sourceStr(source: string): string {
	switch (source) {
		case "api":
			return "API";
		case "dash":
			return "Dashboard";
		case "wrangler":
			return "Wrangler";
		case "terraform":
			return "Terraform";
		default:
			return "Other";
	}
}
