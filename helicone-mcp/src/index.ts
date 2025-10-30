import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import type { components } from "./types/public.js";

type RequestQueryParams = components["schemas"]["RequestQueryParams"];

const app = express();
const PORT = process.env.PORT || 6969;

app.use(express.json());

const server = new McpServer({
	name: "Helicone MCP",
	version: "1.0.0",
});

server.tool(
	"query_requests",
	"Query Helicone requests with filters, pagination, and sorting",
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
	async (params: any, extra) => {
		const headers = extra.requestInfo?.headers ?? {};
		const apiKey = headers["authorization"] || headers["Authorization"];

		if (!apiKey || typeof apiKey !== "string") {
			return {
				content: [
					{
						type: "text",
						text: "Error: Authorization header is required. Please provide 'Authorization: YOUR_HELICONE_API_KEY'",
					},
				],
			};
		}

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
			const response = await fetch("https://api.helicone.ai/v1/request/query-clickhouse", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiKey}`,
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

			const result: any = await response.json();

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result.data, null, 2),
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
