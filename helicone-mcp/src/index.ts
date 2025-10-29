import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { components } from "./types/public";

// Type definitions from the generated public.ts
type RequestQueryParams = components["schemas"]["RequestQueryParams"];
type Result = components["schemas"]["Result_HeliconeRequest-Array.string_"];

// Define our Helicone MCP agent
export class HeliconeMCP extends McpAgent {
	server = new McpServer({
		name: "Helicone Request Query",
		version: "1.0.0",
	});

	async init() {
		// Query requests tool - allows users to query their Helicone requests
		this.server.tool(
			"query_requests",
			{
				filter: z.any().optional().describe("Filter criteria for requests"),
				offset: z.number().optional().describe("Pagination offset"),
				limit: z.number().optional().describe("Maximum number of results to return"),
				sort: z.any().optional().describe("Sort criteria"),
				isCached: z.boolean().optional().describe("Filter for cached requests"),
				includeInputs: z.boolean().optional().describe("Include request inputs"),
				isPartOfExperiment: z.boolean().optional().describe("Filter for experiment requests"),
				isScored: z.boolean().optional().describe("Filter for scored requests"),
			},
			async (params, extra) => {
				// Get the HELICONE_API_KEY from environment
				const apiKey = extra._meta?.HELICONE_API_KEY as string | undefined;

				if (!apiKey) {
					return {
						content: [
							{
								type: "text",
								text: "Error: HELICONE_API_KEY environment variable is required. Please configure it when adding this MCP server.",
							},
						],
					};
				}

				// Build the request body
				const requestBody: RequestQueryParams = {
					filter: params.filter || {},
					offset: params.offset,
					limit: params.limit,
					sort: params.sort,
					isCached: params.isCached,
					includeInputs: params.includeInputs,
					isPartOfExperiment: params.isPartOfExperiment,
					isScored: params.isScored,
				} as RequestQueryParams;

				try {
					// Make the API request
					const response = await fetch("https://api.helicone.ai/v1/request/query-clickhouse", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"Authorization": `Bearer ${apiKey}`,
						},
						body: JSON.stringify(requestBody),
					});

					if (!response.ok) {
						const errorText = await response.text();
						return {
							content: [
								{
									type: "text",
									text: `Error: API request failed with status ${response.status}: ${errorText}`,
								},
							],
						};
					}

					const result: Result = await response.json();

					// Return the results as formatted JSON
					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(result, null, 2),
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error querying Helicone API: ${error instanceof Error ? error.message : String(error)}`,
							},
						],
					};
				}
			},
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return HeliconeMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return HeliconeMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
