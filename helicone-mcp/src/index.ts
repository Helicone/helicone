import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IsomorphicHeaders } from "@modelcontextprotocol/sdk/types.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { fetchRequests, fetchSessions } from "./lib/helicone-client.js";
import { requestFilterNodeSchema, sortLeafRequestSchema, sessionFilterNodeSchema } from "./types/generated-zod.js";

const app = express();
const PORT = process.env.PORT || 6969;

app.use(express.json());

const server = new McpServer({
	name: "Helicone MCP",
	version: "1.0.0",
});

const NO_AUTH_ERROR_RESPONSE = {
  content: [
    {
      type: "text",
      text: "Error: Authorization header is required. Please provide 'Authorization: YOUR_HELICONE_API_KEY'",
    },
  ],
};

function getAuth(headers: IsomorphicHeaders): string | null {
	const apiKey = headers["authorization"] || headers["Authorization"];
	if (!apiKey || typeof apiKey !== "string") {
		return null;
	}
	return apiKey;
}

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
	async (params: any, extra) => {
		const apiKey = getAuth(extra.requestInfo?.headers ?? {});
		if (!apiKey) { return NO_AUTH_ERROR_RESPONSE as any; }

		try {
			const requests = await fetchRequests(apiKey, {
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
	async (params: any, extra) => {
		const apiKey = getAuth(extra.requestInfo?.headers ?? {});
		if (!apiKey) { return NO_AUTH_ERROR_RESPONSE as any; }

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
			const sessions = await fetchSessions(apiKey, {
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

app.post("/mcp", async (req: Request, res: Response) => {
	try {
		const transport = new StreamableHTTPServerTransport({
			sessionIdGenerator: undefined,
		});

		await server.connect(transport);
		await transport.handleRequest(req, res, req.body);

		res.on("close", () => {
			transport.close();
		});
	} catch (error) {
		console.error("MCP request error:", error);
		if (!res.headersSent) {
			res.status(500).json({
				jsonrpc: "2.0",
				error: {
					code: -32603,
					message: "Internal server error",
				},
				id: null,
			});
		}
	}
});

app.get("/health", (_req: Request, res: Response) => {
	res.json({ status: "ok" });
});

const httpServer = app.listen(PORT, () => {
	console.log(`Helicone MCP server running on http://localhost:${PORT}`);
	console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});

httpServer.on("error", (error) => {
	console.error("Server error:", error);
	process.exit(1);
});

process.on("SIGINT", () => {
	console.log("\nShutting down...");
	httpServer.close(() => {
		process.exit(0);
	});
});
