// HARDCODED ALLOWLIST - ONLY THESE METRICS CAN BE SENT
const ALLOWED_METRICS = new Set([
  "worker.request.size_mb",
  "worker.response.size_mb",
  "worker.buffer.remote_used",
  "worker.buffer.unsafe_remote_read",
  // Buffer decision path metrics
  "worker.buffer.decision.get_head",
  "worker.buffer.decision.known_small",
  "worker.buffer.decision.known_large",
  "worker.buffer.decision.unknown_no_container",
  "worker.buffer.decision.tee_small",
  "worker.buffer.decision.tee_large",
]);

export interface DataDogConfig {
  enabled: boolean;
  apiKey: string;
  endpoint: string;
  sampleRate?: number; // 0-1, defaults to 0.05 (5%)
}

export class DataDogClient {
  private config: DataDogConfig;
  // MASTER KILL SWITCH - set to true to disable ALL DataDog
  private readonly DISABLED = false; // Change this to true to kill all DataDog

  constructor(config: DataDogConfig) {
    this.config = {
      sampleRate: 0.05, // Default to 5% sampling
      ...config,
    };
  }

  /**
   * Track actual request body size (called from buffer after reading)
   */
  trackRequestSize(bytes: number): void {
    if (bytes < 0) return; // Skip invalid sizes

    // Convert to MB for easier reading
    const mb = bytes / (1024 * 1024);
    this.sendMetric("worker.request.size_mb", mb);
  }

  /**
   * Track response body size
   */
  trackResponseSize(bytes: number): void {
    if (bytes < 0) return; // Skip invalid sizes

    // Convert to MB for easier reading
    const mb = bytes / (1024 * 1024);
    this.sendMetric("worker.response.size_mb", mb);
  }

  /**
   * Track whether remote buffer was used (for large requests)
   */
  trackBufferType(isRemote: boolean): void {
    this.sendMetric("worker.buffer.remote_used", isRemote ? 1 : 0);
  }

  /**
   * Track unsafe reads from remote buffer (warning metric)
   */
  trackUnsafeRemoteRead(): void {
    this.sendMetric("worker.buffer.unsafe_remote_read", 1);
  }

  /**
   * Track buffer decision path taken
   */
  trackBufferDecision(
    path:
      | "get_head"
      | "known_small"
      | "known_large"
      | "unknown_no_container"
      | "tee_small"
      | "tee_large",
    sizeMB?: number
  ): void {
    const value = sizeMB ?? 1; // Use size if provided, otherwise 1
    this.sendMetric(`worker.buffer.decision.${path}`, value);
  }

  /**
   * Send a metric to DataDog with sampling
   */
  private async sendMetric(metricName: string, value: number): Promise<void> {
    try {
      // Check kill switch
      if (this.DISABLED) return;

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