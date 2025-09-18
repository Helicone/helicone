// Global memory tracking - persists across all requests in worker isolate lifetime
const GLOBAL_MEMORY_ALLOCATIONS = new Map<string, number>();
let GLOBAL_TOTAL_BYTES = 0;
let GLOBAL_PEAK_BYTES = 0;
let GLOBAL_REQUEST_COUNT = 0;
let ISOLATE_START_TIME = Date.now();

export interface DataDogConfig {
  enabled: boolean;
  apiKey: string;
  endpoint: string;
  sampleRate?: number; // 0-1, defaults to 0.1 (10%)
}

export class DataDogClient {
  private config: DataDogConfig;
  private ctx?: ExecutionContext;

  constructor(config: DataDogConfig) {
    this.config = {
      sampleRate: 0.1,
      ...config,
      enabled: false,
    };
  }

  /**
   * Set the ExecutionContext for sending metrics
   */
  setContext(ctx: ExecutionContext): void {
    this.ctx = ctx;
  }

  trackContentLength(bytes: number): void {
    try {
      this.sendDistributionMetric(
        Date.now(),
        bytes,
        "worker.memory.request.content_length"
      );
    } catch (e) {
      // Silently catch - monitoring must never break the app
    }
  }

  trackRemoteBodyBufferUsed(used: boolean): void {
    try {
      this.sendDistributionMetric(
        Date.now(),
        used ? 1 : 0,
        "worker.memory.request.remote_body_buffer_used"
      );
    } catch (e) {
      // Silently catch - monitoring must never break the app
      console.error("[DataDog] Error in trackRemoteBodyBufferUsed:", e);
    }
  }

  /**
   * Track memory allocation globally across worker lifetime
   * Automatically sends metrics to DataDog if context is available
   * OBSERVATIONAL ONLY - Never throws or affects execution
   */
  trackMemory(key: string, bytes: number): void {
    try {
      const previousBytes = GLOBAL_MEMORY_ALLOCATIONS.get(key) || 0;
      const delta = bytes - previousBytes;

      GLOBAL_MEMORY_ALLOCATIONS.set(key, bytes);
      GLOBAL_TOTAL_BYTES += delta;

      // Track peak memory
      if (GLOBAL_TOTAL_BYTES > GLOBAL_PEAK_BYTES) {
        GLOBAL_PEAK_BYTES = GLOBAL_TOTAL_BYTES;
      }

      // Send metrics immediately if we have context
      if (this.ctx && this.config.enabled) {
        this.sendMemoryMetrics(this.ctx);
      }
    } catch (e) {
      // Silently catch - monitoring must never break the app
    }
  }

  /**
   * Increment request counter
   */
  incrementRequestCount(): void {
    GLOBAL_REQUEST_COUNT++;
  }

  /**
   * Send memory metrics to DataDog
   * OBSERVATIONAL ONLY - Never throws or affects execution
   */
  async sendMemoryMetrics(ctx: ExecutionContext): Promise<void> {
    try {
      if (!this.config.enabled) return;

      const timestamp = Math.floor(Date.now() / 1000);
      const globalTotalMB = GLOBAL_TOTAL_BYTES / (1024 * 1024);
      const globalPeakMB = GLOBAL_PEAK_BYTES / (1024 * 1024);
      const uptimeMinutes = (Date.now() - ISOLATE_START_TIME) / 60000;

      const metrics = [
        // Global cumulative memory
        this.sendDistributionMetric(
          timestamp,
          globalTotalMB,
          "worker.memory.cumulative_mb",
          [`requests:${GLOBAL_REQUEST_COUNT}`]
        ),

        // Peak memory
        this.sendDistributionMetric(
          timestamp,
          globalPeakMB,
          "worker.memory.peak_mb",
          [`requests:${GLOBAL_REQUEST_COUNT}`]
        ),

        // Request count
        this.sendDistributionMetric(
          timestamp,
          GLOBAL_REQUEST_COUNT,
          "worker.memory.request_count",
          [`uptime_minutes:${uptimeMinutes.toFixed(1)}`]
        ),
      ];

      // Send individual allocation metrics to identify what's using memory
      for (const [key, bytes] of GLOBAL_MEMORY_ALLOCATIONS.entries()) {
        const mb = bytes / (1024 * 1024);
        if (mb > 0.1) {
          // Only track allocations > 0.1MB
          metrics.push(
            this.sendDistributionMetric(
              timestamp,
              mb,
              "worker.memory.allocation",
              [`key:${key}`, `requests:${GLOBAL_REQUEST_COUNT}`]
            )
          );
        }
      }

      ctx.waitUntil(Promise.all(metrics));
    } catch (error) {
      // Silently fail - monitoring must never break the app
    }
  }

  /**
   * Send distribution metric to DataDog
   */
  private async sendDistributionMetric(
    timestamp: number,
    value: number,
    metricName: string,
    tags: string[] = []
  ): Promise<void> {
    if (this.config.sampleRate && Math.random() > this.config.sampleRate) {
      return;
    }
    try {
      const distribution = {
        series: [
          {
            metric: metricName,
            points: [[timestamp, [value]]],
            host: "cloudflare_worker",
            tags,
          },
        ],
      };

      const response = await fetch(
        `${this.config.endpoint}/v1/distribution_points`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "DD-API-KEY": this.config.apiKey,
          },
          body: JSON.stringify(distribution),
        }
      );
    } catch (e) {
      console.error("[DataDog] Error in sendDistributionMetric:", e);
      // Silently fail - monitoring must never break the app
    }
  }

  /**
   * Utility to estimate string size in bytes
   */
  static estimateStringSize(str: string): number {
    // Rough estimate: UTF-16 uses 2 bytes per character
    // Add 20% overhead for V8 string internals
    return str.length * 2 * 1.2;
  }

  /**
   * Utility to estimate object size in bytes
   */
  static estimateObjectSize(obj: any): number {
    try {
      // JSON stringification gives rough size estimate
      const jsonStr = JSON.stringify(obj);
      return DataDogClient.estimateStringSize(jsonStr);
    } catch {
      return 0;
    }
  }
}

// Singleton instance for entire worker lifetime (NOT per request)
let dataDogClient: DataDogClient | null = null;

export function getDataDogClient(env: Env): DataDogClient {
  if (!dataDogClient) {
    dataDogClient = new DataDogClient({
      enabled: (env.DATADOG_ENABLED ?? "false") === "true",
      apiKey: env.DATADOG_API_KEY || "",
      endpoint: env.DATADOG_ENDPOINT || "",
      sampleRate: 0.05,
    });
  }

  return dataDogClient;
}

// Get global memory stats (for debugging/logging)
export function getGlobalMemoryStats() {
  return {
    totalMB: (GLOBAL_TOTAL_BYTES / (1024 * 1024)).toFixed(2),
    peakMB: (GLOBAL_PEAK_BYTES / (1024 * 1024)).toFixed(2),
    requestCount: GLOBAL_REQUEST_COUNT,
    uptimeMinutes: ((Date.now() - ISOLATE_START_TIME) / 60000).toFixed(1),
    allocationsCount: GLOBAL_MEMORY_ALLOCATIONS.size,
  };
}
