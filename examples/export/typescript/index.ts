/**
 * Helicone Data Export Tool
 * A command-line tool to export request/response data from Helicone's API.
 */

import * as fs from "fs";

interface RequestResponse {
  response_id: string;
  response_created_at: string;
  response_body?: unknown;
  response_status: number;
  signed_body_url?: string;
  [key: string]: any;
}

interface ApiResponse {
  data: RequestResponse[];
}

interface QueryOptions {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  format?: "json" | "jsonl" | "csv";
  includeBody?: boolean;
}

const HELICONE_API_KEY = process.env.HELICONE_API_KEY;
if (!HELICONE_API_KEY) {
  throw new Error("HELICONE_API_KEY environment variable is required");
}

function parseArgs(): QueryOptions {
  const args = process.argv.slice(2);
  const options: QueryOptions = {};

  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case "--start-date":
        options.startDate = new Date(value);
        i++;
        break;
      case "--end-date":
        options.endDate = new Date(value);
        i++;
        break;
      case "--limit":
        options.limit = parseInt(value, 10);
        if (isNaN(options.limit)) {
          throw new Error("Limit must be a number");
        }
        i++;
        break;
      case "--format":
        if (value !== "json" && value !== "jsonl" && value !== "csv") {
          throw new Error("Format must be json, jsonl, or csv");
        }
        options.format = value;
        i++;
        break;
      case "--include-body":
        options.includeBody = true;
        break;
    }
  }

  // Set default values
  const now = new Date();
  options.endDate = options.endDate || now;
  options.startDate =
    options.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  options.format = options.format || "jsonl";
  options.includeBody = options.includeBody || false;

  // Swap dates if start is after end
  if (options.startDate > options.endDate) {
    [options.startDate, options.endDate] = [options.endDate, options.startDate];
  }

  return options;
}

function convertToCSVRow(item: RequestResponse): string {
  const fields = [
    "response_id",
    "response_created_at",
    "response_status",
    "request_created_at",
    "request_body",
    "request_properties",
    "request_user_id",
    "model",
    "prompt_tokens",
    "completion_tokens",
    "latency",
    "cost_usd",
  ];

  return fields
    .map((field) => {
      let value = item[field];
      if (typeof value === "object" && value !== null) {
        value = JSON.stringify(value).replace(/"/g, '""');
      }
      if (value === undefined || value === null) {
        return "";
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    })
    .join(",");
}

function writeCSVHeader(outputStream: fs.WriteStream): void {
  const header = [
    "response_id",
    "response_created_at",
    "response_status",
    "request_created_at",
    "request_body",
    "request_properties",
    "request_user_id",
    "model",
    "prompt_tokens",
    "completion_tokens",
    "latency",
    "cost_usd",
  ].join(",");
  outputStream.write(header + "\n");
}

async function makeRequest(
  offset: number,
  limit: number,
  options: QueryOptions
): Promise<RequestResponse[]> {
  const requestBody = {
    filter: "all",
    isCached: false,
    limit,
    offset,
    sort: { created_at: "desc" },
    includeInputs: false,
    isScored: false,
    isPartOfExperiment: false,
  };

  const response = await fetch(
    "https://api.helicone.ai/v1/request/query-clickhouse",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HELICONE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = (await response.json()) as ApiResponse;
  return data.data || [];
}

async function fetchSignedBody(url: string): Promise<Record<string, any>> {
  if (!url) return {};

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as Record<string, any>;
    return data;
  } catch (e) {
    return {};
  }
}

async function getAllData(options: QueryOptions): Promise<RequestResponse[]> {
  const allData: RequestResponse[] = [];
  let offset = 0;
  const batchSize = Math.min(options.limit || 1000, 1000);
  const outputStream = fs.createWriteStream(`output.${options.format}`, {
    flags: "w",
  });

  if (options.format === "json") {
    outputStream.write("[\n");
  } else if (options.format === "csv") {
    writeCSVHeader(outputStream);
  }

  try {
    while (true) {
      const batchData = await makeRequest(offset, batchSize, options);
      if (!batchData || batchData.length === 0) break;

      // Process records in batches of 10 to avoid rate limiting
      for (let i = 0; i < batchData.length; i += 10) {
        const chunk = batchData.slice(i, i + 10);
        const processedChunk = await Promise.all(
          chunk.map(async (record) => {
            if (options.includeBody && record.signed_body_url) {
              const signedBody = await fetchSignedBody(record.signed_body_url);
              if (signedBody.request) {
                record.request_body = signedBody.request;
              }
              if (signedBody.response) {
                record.response_body = signedBody.response;
              }
            }
            return record;
          })
        );

        // Write processed records to file
        processedChunk.forEach((record) => {
          if (options.format === "json") {
            outputStream.write(
              JSON.stringify(record, null, 2) +
                (allData.length + 1 < (options.limit || Infinity)
                  ? ",\n"
                  : "\n")
            );
          } else if (options.format === "jsonl") {
            outputStream.write(JSON.stringify(record) + "\n");
          } else if (options.format === "csv") {
            outputStream.write(convertToCSVRow(record) + "\n");
          }
        });

        allData.push(...processedChunk);

        if (options.limit && allData.length >= options.limit) {
          break;
        }

        // Add delay between chunks to avoid rate limiting
        if (i + 10 < batchData.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (options.limit && allData.length >= options.limit) {
        break;
      }

      offset += batchSize;
    }
  } finally {
    if (options.format === "json") {
      outputStream.write("]\n");
    }
    outputStream.end();
  }

  return allData;
}

// Main execution
try {
  const options = parseArgs();
  getAllData(options)
    .then(() => {
      process.exit(0);
    })
    .catch((err: Error) => {
      console.error("Error:", err.message);
      process.exit(1);
    });
} catch (err) {
  if (err instanceof Error) {
    console.error("Error:", err.message);
  } else {
    console.error("An unknown error occurred");
  }
  console.error("\nUsage:");
  console.error("  ts-node index.ts [options]");
  console.error("\nOptions:");
  console.error("  --start-date <date>    Start date (default: 30 days ago)");
  console.error("  --end-date <date>      End date (default: now)");
  console.error("  --limit <number>       Maximum number of records to fetch");
  console.error(
    "  --format <format>      Output format: json, jsonl, or csv (default: jsonl)"
  );
  console.error(
    "  --include-body         Include full request/response bodies (default: false)"
  );
  console.error("\nDate format: YYYY-MM-DD or ISO string");
  console.error(
    "Example: ts-node index.ts --start-date 2024-01-01 --end-date 2024-02-01 --limit 5000 --format csv --include-body"
  );
  process.exit(1);
}
