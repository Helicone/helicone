/**
 * Lightweight DataDog APM Tracer
 *
 * Sends distributed traces to DataDog as structured logs for correlation.
 * Uses Datadog Logs API v2 format (since APM direct intake requires an agent).
 *
 * Features:
 * - Minimal bundle size (~200 lines, no external deps)
 * - Async send via ctx.waitUntil (zero impact on response latency)
 * - Tag support for filtering (org_id, provider, model, etc.)
 * - Parent-child span relationships
 * - Trace correlation in Datadog via trace_id/span_id fields
 */

export interface DataDogTracerConfig {
  enabled: boolean;
  apiKey: string;
  endpoint: string; // e.g., "https://http-intake.logs.datadoghq.com"
  sampleRate: number; // 0-1, defaults to 0.01 (1%)
  service?: string; // Default service name
  env?: string; // Environment (production, development, etc.)
}

export interface TraceContext {
  trace_id: string; // 64-bit ID (shared across all spans)
  parent_span_id?: string; // Current span ID for creating children
  sampled: boolean; // Whether this trace should be sent
  tags: Record<string, string>; // Inherited tags for all child spans
}

interface Span {
  trace_id: string;
  span_id: string;
  parent_id?: string;
  name: string;
  resource: string;
  service: string;
  start: number; // nanoseconds since epoch
  duration?: number; // nanoseconds
  meta: Record<string, string>; // String tags
  metrics: Record<string, number>; // Numeric tags
  error?: number; // 1 if error, 0 otherwise
}

export class DataDogTracer {
  private config: DataDogTracerConfig;
  private spans: Map<string, Span> = new Map();
  private traceId?: string;
  private rootSpanId?: string;
  private orgId?: string;

  // MASTER KILL SWITCH - set to true to disable ALL tracing
  private readonly DISABLED = false;

  constructor(config: DataDogTracerConfig) {
    this.config = {
      service: "helicone-worker",
      env: "production",
      ...config,
    };
  }

  setOrgId(orgId: string) {
    this.orgId = orgId;
  }

  /**
   * Start a new trace (root span)
   * Returns trace context for passing to child operations
   */
  startTrace(
    name: string,
    resource: string,
    tags?: Record<string, string>
  ): TraceContext | null {
    // Check kill switch and config
    if (this.DISABLED || !this.config.enabled) {
      return null;
    }

    // Apply sampling decision
    const sampled = Math.random() < this.config.sampleRate;
    if (!sampled) {
      return { trace_id: "", sampled: false, tags: {} };
    }

    // Generate trace ID (64-bit random number as string)
    this.traceId = this.generateId();
    this.rootSpanId = this.generateId();

    const span: Span = {
      trace_id: this.traceId,
      span_id: this.rootSpanId,
      name,
      resource,
      service: this.config.service!,
      start: this.nowNanos(),
      meta: {
        env: this.config.env!,
        ...tags,
      },
      metrics: {},
    };

    this.spans.set(this.rootSpanId, span);

    return {
      trace_id: this.traceId,
      parent_span_id: this.rootSpanId,
      sampled: true,
      tags: {
        env: this.config.env!,
        ...tags,
      },
    };
  }

  /**
   * Start a child span within an existing trace
   * Returns span ID for later finishing
   */
  startSpan(
    name: string,
    resource: string,
    service?: string,
    tags?: Record<string, string>,
    traceContext?: TraceContext
  ): string | null {
    // Use trace context if provided, otherwise use internal state
    const traceId = traceContext?.trace_id || this.traceId;
    const parentSpanId = traceContext?.parent_span_id || this.rootSpanId;
    const sampled = traceContext?.sampled ?? this.traceId != null;

    if (!sampled || !traceId) {
      return null;
    }

    const spanId = this.generateId();
    const span: Span = {
      trace_id: traceId,
      span_id: spanId,
      parent_id: parentSpanId,
      name,
      resource,
      service: service || this.config.service!,
      start: this.nowNanos(),
      meta: {
        ...(traceContext?.tags || {}),
        ...tags,
      },
      metrics: {},
    };

    this.spans.set(spanId, span);
    return spanId;
  }

  /**
   * Add or update a tag on a span
   */
  setTag(spanId: string | null, key: string, value: string | number): void {
    if (!spanId) return;

    const span = this.spans.get(spanId);
    if (!span) return;

    if (typeof value === "string") {
      span.meta[key] = value;
    } else {
      span.metrics[key] = value;
    }
  }

  /**
   * Mark a span as having an error
   */
  setError(spanId: string | null, error: Error | string): void {
    if (!spanId) return;

    const span = this.spans.get(spanId);
    if (!span) return;

    span.error = 1;
    span.meta["error.message"] =
      typeof error === "string" ? error : error.message;
    if (typeof error !== "string" && error.stack) {
      span.meta["error.stack"] = error.stack;
    }
  }

  /**
   * Finish a span (records duration)
   */
  finishSpan(spanId: string | null, tags?: Record<string, string>): void {
    if (!spanId) return;

    const span = this.spans.get(spanId);
    if (!span) return;

    span.duration = this.nowNanos() - span.start;

    if (tags) {
      Object.assign(span.meta, tags);
    }
  }

  /**
   * Finish the root span (marks end of trace)
   */
  finishTrace(tags?: Record<string, string>): void {
    if (!this.rootSpanId) return;
    this.finishSpan(this.rootSpanId, tags);
  }

  /**
   * Send the complete trace to DataDog Logs API
   * Should be called within ctx.waitUntil() to avoid blocking response
   */
  async sendTrace(): Promise<void> {
    try {
      if (this.DISABLED || !this.config.enabled || this.spans.size === 0) {
        return;
      }

      // Convert spans to structured log entries
      const logEntries = Array.from(this.spans.values()).map((span) => {
        // Build ddtags from span metadata
        const tags = [
          `service:${span.service}`,
          `env:${this.config.env}`,
          `operation:${span.name}`,
          `resource:${span.resource}`,
          ...Object.entries(span.meta).map(([k, v]) => `${k}:${v}`),
        ];

        // Add org_id to tags if available
        if (this.orgId) {
          tags.push(`org_id:${this.orgId}`);
        }

        return {
          ddsource: "apm.trace",
          ddtags: tags.join(","),
          hostname: "cloudflare-worker",
          service: span.service,
          message: `[${span.name}] ${span.resource}`,
          timestamp: new Date(span.start / 1_000_000).toISOString(),
          // Trace correlation fields
          trace_id: span.trace_id,
          span_id: span.span_id,
          parent_id: span.parent_id,
          // Core primitives
          org_id: this.orgId, // Top-level field for org_id as a core primitive
          // Span details
          operation: span.name,
          operation_name: span.name, // Facet-friendly field for grouping in Datadog UI
          resource: span.resource,
          duration_ms: span.duration ? span.duration / 1_000_000 : 0,
          error: span.error === 1,
          // Include all meta tags as top-level fields for easier querying
          ...span.meta,
          // Include all numeric metrics
          ...Object.fromEntries(
            Object.entries(span.metrics).map(([k, v]) => [`metric.${k}`, v])
          ),
        };
      });

      // Send to Datadog Logs API (accepts array of log entries)
      const response = await fetch(`${this.config.endpoint}/api/v2/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "DD-API-KEY": this.config.apiKey,
        },
        body: JSON.stringify(logEntries),
      });

      // Clear spans after sending
      this.spans.clear();
      this.traceId = undefined;
      this.rootSpanId = undefined;
    } catch (error) {
      // Silently ignore errors - monitoring must never break the app
      console.error("[DataDogTracer] Failed to send trace:", error);
    }
  }

  /**
   * Get current trace context (for passing to async operations)
   */
  getTraceContext(): TraceContext | null {
    if (!this.traceId || !this.rootSpanId) {
      return null;
    }

    const rootSpan = this.spans.get(this.rootSpanId);
    return {
      trace_id: this.traceId,
      parent_span_id: this.rootSpanId,
      sampled: true,
      tags: rootSpan?.meta || {},
    };
  }

  /**
   * Create a child trace context from a parent span
   */
  createChildContext(
    parentSpanId: string,
    traceContext: TraceContext
  ): TraceContext {
    return {
      ...traceContext,
      parent_span_id: parentSpanId,
    };
  }

  /**
   * Generate a random 64-bit ID as decimal string
   */
  private generateId(): string {
    // Generate random 64-bit number (JavaScript safe integer is 53 bits, so use BigInt)
    const high = Math.floor(Math.random() * 0x100000000);
    const low = Math.floor(Math.random() * 0x100000000);
    const id = BigInt(high) * BigInt(0x100000000) + BigInt(low);
    return id.toString();
  }

  /**
   * Get current time in nanoseconds (Datadog APM format)
   */
  private nowNanos(): number {
    // JavaScript Date.now() is in milliseconds
    // Convert to nanoseconds (multiply by 1,000,000)
    return Date.now() * 1_000_000;
  }
}

/**
 * Create tracer from environment config
 */
export function createDataDogTracer(env: {
  DATADOG_APM_ENABLED?: string;
  DATADOG_API_KEY?: string;
  DATADOG_APM_ENDPOINT?: string;
  DATADOG_APM_SAMPLING_RATE?: string;
  ENVIRONMENT?: string;
}): DataDogTracer {
  return new DataDogTracer({
    enabled: (env.DATADOG_APM_ENABLED ?? "false") === "true",
    apiKey: env.DATADOG_API_KEY || "",
    endpoint:
      env.DATADOG_APM_ENDPOINT || "https://http-intake.logs.us5.datadoghq.com",
    sampleRate: parseFloat(env.DATADOG_APM_SAMPLING_RATE || "0.01"),
    env: env.ENVIRONMENT || "production",
  });
}
