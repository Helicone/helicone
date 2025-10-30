/**
 * Helicone Data Export Tool
 * A command-line tool to export request/response data from Helicone's API.
 *
 * Features:
 * - Auto-recovery from crashes via checkpoint system
 * - Retry logic with exponential backoff
 * - Graceful signal handling (SIGINT/SIGTERM)
 * - Progress tracking with multiple log levels
 * - Pre-flight validation and error handling
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// ============================================================================
// Types and Interfaces
// ============================================================================

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
  outputPath?: string;
  logLevel?: "quiet" | "normal" | "verbose";
  maxRetries?: number;
  batchSize?: number;
  cleanState?: boolean;
  resume?: boolean;
  propertyFilters?: Record<string, string>;
}

interface CheckpointState {
  offset: number;
  totalRecords: number;
  lastUpdateTime: string;
  outputPath: string;
  format: string;
  startDate: string;
  endDate: string;
  includeBody: boolean;
  limit?: number;
}

interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
}

type LogLevel = "quiet" | "normal" | "verbose";

// ============================================================================
// Constants
// ============================================================================

const HELICONE_API_KEY = process.env.HELICONE_API_KEY;
const CHECKPOINT_FILE = ".helicone-export-state.json";
const API_ENDPOINT = "https://api.helicone.ai/v1/request/query-clickhouse";
const DEFAULT_BATCH_SIZE = 1000;
const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_BASE_DELAY = 1000; // 1 second

// ============================================================================
// Checkpoint Manager
// ============================================================================

/**
 * Manages checkpoint state for crash recovery
 */
class CheckpointManager {
  private checkpointPath: string;

  constructor(checkpointPath: string = CHECKPOINT_FILE) {
    this.checkpointPath = checkpointPath;
  }

  /**
   * Check if a checkpoint exists
   */
  exists(): boolean {
    return fs.existsSync(this.checkpointPath);
  }

  /**
   * Load checkpoint state
   */
  load(): CheckpointState | null {
    try {
      if (!this.exists()) {
        return null;
      }
      const content = fs.readFileSync(this.checkpointPath, "utf-8");
      return JSON.parse(content) as CheckpointState;
    } catch (error) {
      console.error("Warning: Failed to load checkpoint:", error);
      return null;
    }
  }

  /**
   * Save checkpoint state
   */
  save(state: CheckpointState): void {
    try {
      fs.writeFileSync(
        this.checkpointPath,
        JSON.stringify(state, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error("Warning: Failed to save checkpoint:", error);
    }
  }

  /**
   * Remove checkpoint file
   */
  remove(): void {
    try {
      if (this.exists()) {
        fs.unlinkSync(this.checkpointPath);
      }
    } catch (error) {
      console.error("Warning: Failed to remove checkpoint:", error);
    }
  }

  /**
   * Validate checkpoint matches current configuration
   * Only checks critical fields - format and output file existence
   */
  validate(state: CheckpointState, options: QueryOptions): boolean {
    // Only validate format matches
    if (state.format !== options.format) {
      console.error(
        `Checkpoint format mismatch: ${state.format} vs ${options.format}`
      );
      return false;
    }

    // Only validate output file exists
    if (!fs.existsSync(state.outputPath)) {
      console.error(`Output file not found: ${state.outputPath}`);
      return false;
    }

    return true;
  }
}

// ============================================================================
// Progress Tracker
// ============================================================================

/**
 * Tracks and displays export progress
 */
class ProgressTracker {
  private logLevel: LogLevel;
  private startTime: number;
  private lastLogTime: number;
  private totalProcessed: number = 0;
  private estimatedTotal?: number;

  constructor(logLevel: LogLevel = "normal", estimatedTotal?: number) {
    this.logLevel = logLevel;
    this.startTime = Date.now();
    this.lastLogTime = Date.now();
    this.estimatedTotal = estimatedTotal;
  }

  log(message: string, level: LogLevel = "normal"): void {
    if (this.logLevel === "quiet") return;
    if (level === "verbose" && this.logLevel !== "verbose") return;

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  updateProgress(processed: number, message?: string): void {
    this.totalProcessed = processed;

    if (this.logLevel === "quiet") return;

    const elapsed = Date.now() - this.startTime;
    const rate = processed / (elapsed / 1000);

    if (this.logLevel === "normal") {
      // Progress bar mode
      let progressStr = `Processed: ${processed} records`;

      if (this.estimatedTotal) {
        const percent = Math.min(
          100,
          Math.round((processed / this.estimatedTotal) * 100)
        );
        const barLength = 30;
        const filled = Math.round((percent / 100) * barLength);
        const bar = "=".repeat(filled) + " ".repeat(barLength - filled);
        progressStr = `[${bar}] ${percent}% (${processed}/${this.estimatedTotal})`;

        if (rate > 0 && processed < this.estimatedTotal) {
          const remaining = this.estimatedTotal - processed;
          const etaSeconds = Math.round(remaining / rate);
          const etaMin = Math.floor(etaSeconds / 60);
          const etaSec = etaSeconds % 60;
          progressStr += ` ETA: ${etaMin}m ${etaSec}s`;
        }
      }

      progressStr += ` | ${rate.toFixed(1)} rec/s`;

      if (message) {
        progressStr += ` | ${message}`;
      }

      // Clear line and write progress
      process.stdout.write("\r" + progressStr + " ".repeat(10));
    } else if (this.logLevel === "verbose") {
      this.log(
        `Progress: ${processed} records processed (${rate.toFixed(1)} rec/s)${message ? ` - ${message}` : ""}`,
        "verbose"
      );
    }
  }

  complete(total: number): void {
    const elapsed = Date.now() - this.startTime;
    const elapsedMin = Math.floor(elapsed / 60000);
    const elapsedSec = Math.round((elapsed % 60000) / 1000);

    if (this.logLevel === "normal") {
      process.stdout.write("\n"); // Clear progress bar line
    }

    this.log(
      `✓ Export complete: ${total} records in ${elapsedMin}m ${elapsedSec}s`
    );
  }

  error(message: string): void {
    if (this.logLevel === "normal") {
      process.stdout.write("\n"); // Clear progress bar line
    }
    console.error(`✗ Error: ${message}`);
  }
}

// ============================================================================
// Helicone API Client with Retry Logic
// ============================================================================

/**
 * API client with automatic retry and exponential backoff
 */
class HeliconeClient {
  private apiKey: string;
  private retryOptions: RetryOptions;
  private progressTracker: ProgressTracker;

  constructor(
    apiKey: string,
    retryOptions: RetryOptions,
    progressTracker: ProgressTracker
  ) {
    this.apiKey = apiKey;
    this.retryOptions = retryOptions;
    this.progressTracker = progressTracker;
  }

  /**
   * Sleep for a specified duration
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Make API request with retry logic and exponential backoff
   */
  async makeRequest(
    offset: number,
    batchSize: number,
    filter: any,
    options: QueryOptions
  ): Promise<RequestResponse[]> {
    const requestBody = {
      filter,
      isCached: false,
      limit: batchSize,
      offset,
      sort: { created_at: "desc" },
      includeInputs: false,
      isScored: false,
      isPartOfExperiment: false,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        const filterInfo =
          options.propertyFilters &&
          Object.keys(options.propertyFilters).length > 0
            ? ` with filters: ${JSON.stringify(options.propertyFilters)}`
            : "";
        this.progressTracker.log(
          `API request: offset=${offset}, batchSize=${batchSize}${filterInfo} (attempt ${attempt + 1}/${this.retryOptions.maxRetries + 1})`,
          "verbose"
        );

        const response = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();

          // Handle rate limiting specially
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            const waitTime = retryAfter
              ? parseInt(retryAfter, 10) * 1000
              : this.retryOptions.baseDelay * Math.pow(2, attempt);

            this.progressTracker.log(
              `Rate limited. Waiting ${waitTime / 1000}s before retry...`,
              "normal"
            );
            await this.sleep(waitTime);
            continue;
          }

          throw new Error(
            `API request failed: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const data = (await response.json()) as ApiResponse;
        this.progressTracker.log(
          `API response: received ${data.data?.length || 0} records`,
          "verbose"
        );
        return data.data || [];
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.retryOptions.maxRetries) {
          const waitTime = this.retryOptions.baseDelay * Math.pow(2, attempt);
          this.progressTracker.log(
            `Request failed: ${lastError.message}. Retrying in ${waitTime / 1000}s... (attempt ${attempt + 1}/${this.retryOptions.maxRetries})`,
            "normal"
          );
          await this.sleep(waitTime);
        }
      }
    }

    throw new Error(
      `API request failed after ${this.retryOptions.maxRetries + 1} attempts: ${lastError?.message}`
    );
  }

  /**
   * Fetch signed body URL with retry logic
   */
  async fetchSignedBody(url: string): Promise<Record<string, any>> {
    if (!url) return {};

    for (let attempt = 0; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = (await response.json()) as Record<string, any>;
        return data;
      } catch (error) {
        this.progressTracker.log(
          `Failed to fetch signed body: ${(error as Error).message}`,
          "verbose"
        );

        if (attempt < this.retryOptions.maxRetries) {
          const waitTime = this.retryOptions.baseDelay * Math.pow(2, attempt);
          await this.sleep(waitTime);
        }
      }
    }

    // Return empty object on failure (non-critical)
    return {};
  }
}

// ============================================================================
// Export Writer
// ============================================================================

/**
 * Handles file writing for different export formats
 */
class ExportWriter {
  private format: "json" | "jsonl" | "csv";
  private outputPath: string;
  private stream: fs.WriteStream;
  private recordsWritten: number = 0;
  private isFirstRecord: boolean = true;
  private instanceId: string;

  constructor(
    format: "json" | "jsonl" | "csv",
    outputPath: string,
    append: boolean = false
  ) {
    this.instanceId = Math.random().toString(36).substring(7);
    this.format = format;
    this.outputPath = outputPath;

    // Create stream in append mode if resuming
    this.stream = fs.createWriteStream(outputPath, {
      flags: append ? "a" : "w",
    });

    // For JSON format, we need to handle array continuation
    if (format === "json" && !append) {
      this.stream.write("[\n");
    }

    // For CSV, write header if not appending
    if (format === "csv" && !append) {
      this.writeCSVHeader();
    }

    this.isFirstRecord = !append;
  }

  private writeCSVHeader(): void {
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
      "cost",
    ].join(",");
    this.stream.write(header + "\n");
  }

  private convertToCSVRow(item: RequestResponse): string {
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
      "cost",
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

  writeRecord(record: RequestResponse): void {
    if (this.format === "json") {
      if (!this.isFirstRecord) {
        this.stream.write(",\n");
      }
      this.stream.write(JSON.stringify(record, null, 2));
      this.isFirstRecord = false;
    } else if (this.format === "jsonl") {
      this.stream.write(JSON.stringify(record) + "\n");
    } else if (this.format === "csv") {
      this.stream.write(this.convertToCSVRow(record) + "\n");
    }

    this.recordsWritten++;
  }

  writeRecords(records: RequestResponse[]): void {
    records.forEach((record) => {
      this.writeRecord(record);
    });
  }

  async close(): Promise<void> {
    if (this.format === "json") {
      this.stream.write("\n]\n");
    }

    return new Promise((resolve) => {
      this.stream.end(() => {
        resolve();
      });
    });
  }

  getRecordsWritten(): number {
    return this.recordsWritten;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Prompt user for yes/no confirmation
 */
async function promptUser(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

/**
 * Validate pre-flight requirements
 */
export function validatePreFlight(options: QueryOptions): void {
  // Check API key format
  if (!HELICONE_API_KEY || HELICONE_API_KEY.length < 10) {
    throw new Error("Invalid HELICONE_API_KEY format");
  }

  // Check output directory exists
  const outputDir = path.dirname(options.outputPath!);
  if (!fs.existsSync(outputDir)) {
    throw new Error(`Output directory does not exist: ${outputDir}`);
  }

  // Check write permissions
  try {
    fs.accessSync(outputDir, fs.constants.W_OK);
  } catch {
    throw new Error(`No write permission for directory: ${outputDir}`);
  }

  // Check disk space (warn if < 1GB)
  try {
    const stats = fs.statSync(outputDir);
    // Note: This is a simplified check, actual implementation would need platform-specific disk space check
  } catch (error) {
    console.warn("Warning: Could not check disk space");
  }

  // Validate date range
  if (
    options.startDate &&
    options.endDate &&
    options.startDate > options.endDate
  ) {
    throw new Error("Start date must be before end date");
  }
}

export function parseArgs(): QueryOptions {
  const args = process.argv.slice(2);
  const options: QueryOptions = {};

  // Check for help flag first
  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

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
      case "--output":
      case "-o":
        options.outputPath = value;
        i++;
        break;
      case "--log-level":
        if (value !== "quiet" && value !== "normal" && value !== "verbose") {
          throw new Error("Log level must be quiet, normal, or verbose");
        }
        options.logLevel = value;
        i++;
        break;
      case "--max-retries":
        options.maxRetries = parseInt(value, 10);
        if (isNaN(options.maxRetries)) {
          throw new Error("Max retries must be a number");
        }
        i++;
        break;
      case "--batch-size":
        options.batchSize = parseInt(value, 10);
        if (isNaN(options.batchSize)) {
          throw new Error("Batch size must be a number");
        }
        i++;
        break;
      case "--clean-state":
        options.cleanState = true;
        break;
      case "--resume":
        options.resume = true;
        break;
      case "--property":
      case "-p":
        // Format: --property key=value
        if (value && value.includes("=")) {
          const [key, val] = value.split("=");
          if (!options.propertyFilters) {
            options.propertyFilters = {};
          }
          options.propertyFilters[key] = val;
          i++;
        } else {
          throw new Error(
            "Property filter must be in format: --property key=value"
          );
        }
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
  options.logLevel = options.logLevel || "normal";
  options.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  options.batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
  options.outputPath = options.outputPath || `output.${options.format}`;

  // Swap dates if start is after end
  if (options.startDate > options.endDate) {
    [options.startDate, options.endDate] = [options.endDate, options.startDate];
  }

  return options;
}

// ============================================================================
// Main Export Logic
// ============================================================================

/**
 * Main export function with checkpoint support
 */
export async function exportData(options: QueryOptions): Promise<void> {
  // Check API key is set
  if (!HELICONE_API_KEY) {
    throw new Error("HELICONE_API_KEY environment variable is required");
  }

  const checkpointManager = new CheckpointManager();
  const progressTracker = new ProgressTracker(options.logLevel!, options.limit);

  // Handle clean state flag
  if (options.cleanState) {
    checkpointManager.remove();
    progressTracker.log("Checkpoint state cleared");
  }

  // Check for existing checkpoint
  let checkpoint = checkpointManager.load();
  let resuming = false;

  if (checkpoint) {
    progressTracker.log(
      `Found previous export: ${checkpoint.totalRecords} records processed (last update: ${checkpoint.lastUpdateTime})`
    );

    // Validate checkpoint
    if (!checkpointManager.validate(checkpoint, options)) {
      progressTracker.log(
        "Checkpoint validation failed. Starting fresh export."
      );
      checkpoint = null;
      checkpointManager.remove();
    } else {
      // Check if --resume flag was provided
      if (options.resume) {
        resuming = true;
        progressTracker.log(`Resuming export from offset ${checkpoint.offset}`);

        // Restore checkpoint configuration (but allow override of limit)
        options.startDate = new Date(checkpoint.startDate);
        options.endDate = new Date(checkpoint.endDate);
        options.includeBody = checkpoint.includeBody;
        // Only restore limit if not explicitly provided by user
        if (!process.argv.includes('--limit')) {
          options.limit = checkpoint.limit;
        }
        options.outputPath = checkpoint.outputPath;
      } else {
        // Prompt user for resume confirmation
        const shouldResume = await promptUser("Resume from checkpoint? (y/n): ");

        if (shouldResume) {
          resuming = true;
          progressTracker.log(`Resuming export from offset ${checkpoint.offset}`);

          // Restore checkpoint configuration (but allow override of limit)
          options.startDate = new Date(checkpoint.startDate);
          options.endDate = new Date(checkpoint.endDate);
          options.includeBody = checkpoint.includeBody;
          // Only restore limit if not explicitly provided by user
          if (!process.argv.includes('--limit')) {
            options.limit = checkpoint.limit;
          }
          options.outputPath = checkpoint.outputPath;
        } else {
          progressTracker.log("Starting fresh export");
          checkpoint = null;
          checkpointManager.remove();
        }
      }
    }
  }

  // Validate pre-flight
  validatePreFlight(options);

  // Check if output file exists and we're not resuming
  if (!resuming && fs.existsSync(options.outputPath!)) {
    const shouldOverwrite = await promptUser(
      `Output file '${options.outputPath}' already exists. Overwrite? (y/n): `
    );

    if (!shouldOverwrite) {
      progressTracker.log("Export cancelled by user.");
      return;
    }

    // Explicitly remove the file to ensure clean start
    try {
      fs.unlinkSync(options.outputPath!);
    } catch (e) {
      // File might not exist, that's okay
    }
  }

  // Initialize components
  const client = new HeliconeClient(
    HELICONE_API_KEY,
    {
      maxRetries: options.maxRetries!,
      baseDelay: DEFAULT_BASE_DELAY,
    },
    progressTracker
  );

  const writer = new ExportWriter(
    options.format!,
    options.outputPath!,
    resuming
  );

  // Build filter object with proper AST structure
  // Each condition must be a separate leaf in the tree
  let filter: any = "all";

  // Build date range filter (if provided)
  let dateRangeFilter: any = null;
  if (options.startDate && options.endDate) {
    // Both start and end date - need to AND them together
    dateRangeFilter = {
      left: {
        request_response_rmt: {
          request_created_at: {
            gte: options.startDate.toISOString(),
          },
        },
      },
      operator: "and",
      right: {
        request_response_rmt: {
          request_created_at: {
            lte: options.endDate.toISOString(),
          },
        },
      },
    };
  } else if (options.startDate) {
    // Only start date
    dateRangeFilter = {
      request_response_rmt: {
        request_created_at: {
          gte: options.startDate.toISOString(),
        },
      },
    };
  } else if (options.endDate) {
    // Only end date
    dateRangeFilter = {
      request_response_rmt: {
        request_created_at: {
          lte: options.endDate.toISOString(),
        },
      },
    };
  }

  // Build property filters (if provided)
  let propertyFilter: any = null;
  if (
    options.propertyFilters &&
    Object.keys(options.propertyFilters).length > 0
  ) {
    const propertyEntries = Object.entries(options.propertyFilters);

    if (propertyEntries.length === 1) {
      // Single property filter
      const [key, value] = propertyEntries[0];
      propertyFilter = {
        request_response_rmt: {
          properties: {
            [key]: {
              equals: value,
            },
          },
        },
      };
    } else {
      // Multiple property filters - AND them together
      propertyFilter = propertyEntries.reduce((acc, [key, value], index) => {
        const condition = {
          request_response_rmt: {
            properties: {
              [key]: {
                equals: value,
              },
            },
          },
        };

        if (index === 0) {
          return condition;
        } else {
          return {
            left: acc,
            operator: "and",
            right: condition,
          };
        }
      }, null as any);
    }
  }

  // Combine date range and property filters
  if (dateRangeFilter && propertyFilter) {
    filter = {
      left: dateRangeFilter,
      operator: "and",
      right: propertyFilter,
    };
  } else if (dateRangeFilter) {
    filter = dateRangeFilter;
  } else if (propertyFilter) {
    filter = propertyFilter;
  }

  // Start export
  let offset = checkpoint?.offset || 0;
  let totalRecords = checkpoint?.totalRecords || 0;
  const batchSize = options.batchSize!;

  // Setup signal handlers for graceful shutdown - MUST be after offset/totalRecords are defined
  let shuttingDown = false;
  const signalHandler = async () => {
    if (shuttingDown) return;
    shuttingDown = true;

    progressTracker.log("\n\nReceived interrupt signal. Saving progress...");

    // Save checkpoint with current state
    checkpointManager.save({
      offset,
      totalRecords,
      lastUpdateTime: new Date().toISOString(),
      outputPath: options.outputPath!,
      format: options.format!,
      startDate: options.startDate!.toISOString(),
      endDate: options.endDate!.toISOString(),
      includeBody: options.includeBody!,
      limit: options.limit,
    });

    await writer.close();
    progressTracker.log(`Progress saved. Resume with: --resume`);
    process.exit(0);
  };

  process.on("SIGINT", signalHandler);
  process.on("SIGTERM", signalHandler);

  let exportInfo = `Starting export: format=${options.format}, output=${options.outputPath}`;
  if (
    options.propertyFilters &&
    Object.keys(options.propertyFilters).length > 0
  ) {
    exportInfo += `, filters=${JSON.stringify(options.propertyFilters)}`;
  }
  progressTracker.log(exportInfo);

  try {
    while (true) {
      if (shuttingDown) break;

      // Fetch batch
      const batchData = await client.makeRequest(offset, batchSize, filter, options);

      progressTracker.log(
        `Fetched ${batchData?.length || 0} records at offset ${offset}`,
        "verbose"
      );

      if (!batchData || batchData.length === 0) {
        progressTracker.log(
          `No more records found. Total collected: ${totalRecords}`,
          "verbose"
        );
        break;
      }

      // Process records in chunks to avoid overwhelming signed body fetches
      for (let i = 0; i < batchData.length; i += 10) {
        if (shuttingDown) break;

        const chunk = batchData.slice(i, i + 10);

        const processedChunk = await Promise.all(
          chunk.map(async (record) => {
            // Drop streamed_data field if present (can be very large)
            if (record.streamed_data) {
              delete record.streamed_data;
            }

            if (options.includeBody && record.signed_body_url) {
              const signedBody = await client.fetchSignedBody(
                record.signed_body_url
              );
              if (signedBody.request) {
                record.request_body = signedBody.request;
                // Remove streamed_data from request if present
                if (record.request_body && typeof record.request_body === 'object' && 'streamed_data' in record.request_body) {
                  delete (record.request_body as any).streamed_data;
                }
              }
              if (signedBody.response) {
                record.response_body = signedBody.response;
                // Remove streamed_data from response if present
                if (record.response_body && typeof record.response_body === 'object' && 'streamed_data' in record.response_body) {
                  delete (record.response_body as any).streamed_data;
                }
              }
            }
            return record;
          })
        );

        // Check if writing this chunk would exceed the limit
        let recordsToWrite = processedChunk;
        if (options.limit && totalRecords + processedChunk.length > options.limit) {
          const remaining = options.limit - totalRecords;
          recordsToWrite = processedChunk.slice(0, remaining);
        }

        // Write processed records (possibly truncated to limit)
        writer.writeRecords(recordsToWrite);
        totalRecords += recordsToWrite.length;

        // Update progress
        progressTracker.updateProgress(totalRecords);

        // Check limit
        if (options.limit && totalRecords >= options.limit) {
          progressTracker.log(
            `Reached user limit of ${options.limit} records`,
            "verbose"
          );
          break;
        }

        // Small delay between chunks
        if (i + 10 < batchData.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Save checkpoint after each batch
      checkpointManager.save({
        offset: offset + batchSize,
        totalRecords,
        lastUpdateTime: new Date().toISOString(),
        outputPath: options.outputPath!,
        format: options.format!,
        startDate: options.startDate!.toISOString(),
        endDate: options.endDate!.toISOString(),
        includeBody: options.includeBody!,
        limit: options.limit,
      });

      // Check if we've hit the limit
      if (options.limit && totalRecords >= options.limit) {
        break;
      }

      offset += batchSize;
    }

    // Export complete
    await writer.close();
    progressTracker.complete(totalRecords);
    checkpointManager.remove();

    let summaryMsg = `Output written to: ${options.outputPath}`;
    if (
      options.propertyFilters &&
      Object.keys(options.propertyFilters).length > 0
    ) {
      summaryMsg += ` (${totalRecords} records matched filters: ${JSON.stringify(options.propertyFilters)})`;
    }
    progressTracker.log(summaryMsg);
  } catch (error) {
    progressTracker.error((error as Error).message);

    // Save checkpoint on error
    checkpointManager.save({
      offset,
      totalRecords,
      lastUpdateTime: new Date().toISOString(),
      outputPath: options.outputPath!,
      format: options.format!,
      startDate: options.startDate!.toISOString(),
      endDate: options.endDate!.toISOString(),
      includeBody: options.includeBody!,
      limit: options.limit,
    });

    await writer.close();
    throw error;
  } finally {
    // Clean up signal handlers
    process.off("SIGINT", signalHandler);
    process.off("SIGTERM", signalHandler);
  }
}

// ============================================================================
// Main Execution
// ============================================================================

export function printUsage(): void {
  console.error("\nHelicone Data Export Tool");
  console.error("=========================\n");
  console.error("Usage:");
  console.error("  npx @helicone/export [options]");
  console.error("  npx @helicone/export --help\n");
  console.error("Core Options:");
  console.error(
    "  --start-date <date>       Start date (default: 30 days ago)"
  );
  console.error("  --end-date <date>         End date (default: now)");
  console.error(
    "  --limit <number>          Maximum number of records to fetch"
  );
  console.error(
    "  --format <format>         Output format: json, jsonl, or csv (default: jsonl)"
  );
  console.error(
    "  --include-body            Include full request/response bodies (default: false)"
  );
  console.error(
    "  --output, -o <path>       Output file path (default: output.<format>)"
  );
  console.error(
    "  --property, -p <key=val>  Filter by property (e.g., --property appname=LlamaCoder)"
  );
  console.error("  --help, -h                Show this help message\n");
  console.error("Advanced Options:");
  console.error(
    "  --log-level <level>       Log level: quiet, normal, or verbose (default: normal)"
  );
  console.error(
    "  --max-retries <number>    Maximum retry attempts (default: 5)"
  );
  console.error(
    "  --batch-size <number>     Batch size for API requests (default: 1000)"
  );
  console.error(
    "  --clean-state             Remove checkpoint and start fresh"
  );
  console.error(
    "  --resume                  Explicitly resume from checkpoint\n"
  );
  console.error("Features:");
  console.error("  ✓ Auto-recovery from crashes via checkpoint system");
  console.error("  ✓ Retry logic with exponential backoff");
  console.error("  ✓ Graceful shutdown on Ctrl+C (saves progress)");
  console.error("  ✓ Progress tracking with ETA");
  console.error("  ✓ Pre-flight validation\n");
  console.error("Examples:");
  console.error("  # Basic export");
  console.error("  npx @helicone/export --start-date 2024-01-01 --limit 5000\n");
  console.error("  # Export with property filter (e.g., appname=LlamaCoder)");
  console.error(
    "  npx @helicone/export --property appname=LlamaCoder --limit 1000\n"
  );
  console.error("  # Export with bodies in CSV format");
  console.error(
    "  npx @helicone/export --format csv --include-body --output data.csv\n"
  );
  console.error("  # Verbose logging with custom retry settings");
  console.error("  npx @helicone/export --log-level verbose --max-retries 10\n");
  console.error("  # Clean state and start fresh");
  console.error("  npx @helicone/export --clean-state\n");
}
