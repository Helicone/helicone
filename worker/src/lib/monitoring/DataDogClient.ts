// HARDCODED ALLOWLIST - ONLY THESE METRICS CAN BE SENT
const ALLOWED_METRICS = new Set([
  "worker.request.size_mb",
  "worker.response.size_mb",
  "worker.buffer.remote_used",
]);

export interface DataDogConfig {
  enabled: boolean;
  apiKey: string;
  endpoint: string;
  sampleRate?: number; // 0-1, defaults to 0.05 (5%)
}

export class DataDogClient {
  private config: DataDogConfig;
  private disabled: boolean;

  constructor(config: DataDogConfig) {
    // MASTER KILL SWITCH - hardcode to false to completely disable
    this.disabled = false; // Set to true to disable ALL DataDog functionality

    this.config = {
      sampleRate: 0.05, // Default to 5% sampling
      ...config,
    };
  }

  /**
   * Track request body size
   */
  trackRequestSize(bytes: number): void {
    if (this.disabled) return; // Master kill switch
    if (bytes < 0) return; // Skip invalid sizes

    // Convert to MB for easier reading
    const mb = bytes / (1024 * 1024);
    this.sendMetric("worker.request.size_mb", mb);
  }

  /**
   * Track response body size
   */
  trackResponseSize(bytes: number): void {
    if (this.disabled) return; // Master kill switch
    if (bytes < 0) return; // Skip invalid sizes

    // Convert to MB for easier reading
    const mb = bytes / (1024 * 1024);
    this.sendMetric("worker.response.size_mb", mb);
  }

  /**
   * Track whether remote buffer was used (for large requests)
   */
  trackBufferType(isRemote: boolean): void {
    if (this.disabled) return; // Master kill switch
    this.sendMetric("worker.buffer.remote_used", isRemote ? 1 : 0);
  }

  /**
   * Send a metric to DataDog with sampling
   */
  private async sendMetric(metricName: string, value: number): Promise<void> {
    try {
      // MASTER KILL SWITCH
      if (this.disabled) return;

      // STRICT VALIDATION - ONLY ALLOWED METRICS
      if (!ALLOWED_METRICS.has(metricName)) {
        console.error(`[DataDog] Blocked unauthorized metric: ${metricName}`);
        return;
      }

      // Apply sampling
      if (!this.config.enabled) return;
      if (Math.random() > (this.config.sampleRate ?? 0.05)) return;

      const timestamp = Math.floor(Date.now() / 1000);

      const distribution = {
        series: [
          {
            metric: metricName,
            points: [[timestamp, [value]]],
            host: "cloudflare_worker",
            tags: [], // NO TAGS AT ALL - ZERO RISK OF HIGH CARDINALITY
          },
        ],
      };

      // Fire and forget - don't await
      fetch(`${this.config.endpoint}/v1/distribution_points`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "DD-API-KEY": this.config.apiKey,
        },
        body: JSON.stringify(distribution),
      }).catch(() => {
        // Silently ignore errors - monitoring must never break the app
      });
    } catch {
      // Silently ignore errors
    }
  }

  // Legacy methods - do nothing now
  setContext(ctx: ExecutionContext): void {
    // No-op - removed complex memory tracking
  }

  trackContentLength(bytes: number): void {
    // Redirect to new method for compatibility
    this.trackRequestSize(bytes);
  }

  trackRemoteBodyBufferUsed(used: boolean): void {
    // Redirect to new method for compatibility
    this.trackBufferType(used);
  }

  trackMemory(key: string, bytes: number): void {
    // No-op - removed complex memory tracking
  }

  incrementRequestCount(): void {
    // No-op - removed request counting
  }

  async sendMemoryMetrics(ctx: ExecutionContext): Promise<void> {
    // No-op - removed complex memory metrics
  }

  // Legacy static methods - keep for compatibility but they do nothing
  static estimateStringSize(str: string): number {
    return 0; // No-op
  }

  static estimateObjectSize(obj: any): number {
    return 0; // No-op
  }
}

// Singleton instance
let dataDogClient: DataDogClient | null = null;

export function getDataDogClient(env: Env): DataDogClient {
  if (!dataDogClient) {
    dataDogClient = new DataDogClient({
      enabled: (env.DATADOG_ENABLED ?? "false") === "true",
      apiKey: env.DATADOG_API_KEY || "",
      endpoint: env.DATADOG_ENDPOINT || "",
      sampleRate: 0.05, // 5% sampling
    });
  }

  return dataDogClient;
}

// Legacy export - returns empty stats
export function getGlobalMemoryStats() {
  return {
    totalMB: "0",
    peakMB: "0",
    requestCount: 0,
    uptimeMinutes: "0",
    allocationsCount: 0,
  };
}
