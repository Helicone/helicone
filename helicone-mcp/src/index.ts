#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fetchRequests, fetchSessions, useAiGateway } from "./lib/helicone-client.js";
import { requestFilterNodeSchema, sortLeafRequestSchema, sessionFilterNodeSchema } from "./types/generated-zod.js";

const HELICONE_API_KEY = process.env.HELICONE_API_KEY;

if (!HELICONE_API_KEY) {
	console.error("Error: HELICONE_API_KEY environment variable is not set");
	process.exit(1);
}

const server = new McpServer({
	name: "Helicone MCP",
	version: "1.0.0",
});

server.tool(
	"query_requests",
	"Query Helicone requests with filters, pagination, sorting, and optional body content",
	{
		filter: requestFilterNodeSchema.optional().describe("Filter criteria for requests"),
		offset: z.number().optional().describe("Pagination offset (default: 0)"),
		limit: z.number().optional().describe("Maximum number of results to return (default: 100)"),
		sort: sortLeafRequestSchema.optional().describe("Sort criteria"),
		includeBodies: z.boolean().optional().describe("Fetch and include request/response bodies (default: false). If true, fetches content from signed URLs."),
	},
	async (params: any) => {
		try {
			const requests = await fetchRequests(HELICONE_API_KEY, {
				filter: params.filter || {},
				offset: params.offset ?? 0,
				limit: params.limit ?? 100,
				sort: params.sort,
				includeBodies: params.includeBodies ?? false,
			});

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(requests, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error querying Helicone requests: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
			};
		}
	}
);

/**
 * Query sessions tool
 */
server.tool(
	"query_sessions",
	"Query Helicone sessions with filters, search, time range, and pagination. Returns session metadata that can be used to filter requests.",
	{
		search: z.string().optional().describe("Search term to filter sessions by name or metadata"),
		startTimeUnixMs: z.number().describe("Start time for session query (Unix timestamp in milliseconds)"),
		endTimeUnixMs: z.number().describe("End time for session query (Unix timestamp in milliseconds)"),
		nameEquals: z.string().optional().describe("Filter sessions by exact name match"),
		timezoneDifference: z.number().describe("Timezone difference in hours (e.g., -5 for EST)"),
		filter: sessionFilterNodeSchema.optional().describe("Advanced filter criteria"),
		offset: z.number().optional().describe("Pagination offset (default: 0)"),
		limit: z.number().optional().describe("Maximum number of results to return (default: 100)"),
	},
	async (params: any) => {
		if (!params.startTimeUnixMs || !params.endTimeUnixMs) {
			return {
				content: [
					{
						type: "text",
						text: "Error: Both startTimeUnixMs and endTimeUnixMs are required parameters",
					},
				],
			};
		}

		try {
			const sessions = await fetchSessions(HELICONE_API_KEY, {
				search: params.search,
				timeFilter: {
					startTimeUnixMs: params.startTimeUnixMs,
					endTimeUnixMs: params.endTimeUnixMs,
				},
				nameEquals: params.nameEquals,
				timezoneDifference: params.timezoneDifference ?? 0,
				filter: params.filter || {},
				offset: params.offset ?? 0,
				limit: params.limit ?? 100,
			});

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(sessions, null, 2),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text",
						text: `Error querying Helicone sessions: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
			};
		}
	}
);

/**
 * AI Gateway tool - Make LLM requests through Helicone AI Gateway
 */
server.tool(
	"use_ai_gateway",
	"Make LLM requests through Helicone AI Gateway with automatic observability. Supports 100+ models from OpenAI, Anthropic, Google, and more using OpenAI SDK format.",
	{
		model: z.string().describe("Model name (e.g., 'gpt-4o', 'claude-sonnet-4', 'gemini-2.0-flash')"),
		messages: z.array(z.object({
			role: z.enum(["system", "user", "assistant"]).describe("Message role"),
			content: z.string().describe("Message content")
		})).describe("Array of messages for the conversation"),
		max_tokens: z.number().optional().describe("Maximum tokens to generate (default varies by model)"),
		temperature: z.number().optional().describe("Temperature for response randomness (0-2, default 1)"),
		stream: z.boolean().optional().describe("Enable streaming response (default false)"),
		sessionId: z.string().optional().describe("Session ID for tracking related requests"),
		sessionName: z.string().optional().describe("Human-readable session name"),
		userId: z.string().optional().describe("User ID for tracking requests by user"),
		customProperties: z.record(z.any()).optional().describe("Custom properties for request metadata")
	},
	async (params: any) => {
		try {
			const { model, messages, max_tokens, temperature, stream, sessionId, sessionName, userId, customProperties, ...otherParams } = params;

			const request = {
				model,
				messages,
				...(max_tokens && { max_tokens }),
				...(temperature !== undefined && { temperature }),
				...(stream !== undefined && { stream }),
				...otherParams
			};

			const options = {
				...(sessionId && { sessionId }),
				...(sessionName && { sessionName }),
				...(userId && { userId }),
				...(customProperties && { customProperties })
			};

			const result = await useAiGateway(HELICONE_API_KEY, request, options);

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
						text: `Error using AI Gateway: ${error instanceof Error ? error.message : String(error)}`,
					},
				],
			};
		}
	}
);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch((error) => {
	console.error("Failed to start MCP server:", error);
	process.exit(1);
});
