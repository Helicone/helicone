import { PromiseGenericResult, err, ok } from "../../packages/common/result";
import { gzip } from "zlib";
import { promisify } from "util";
import { SecretManager } from "@helicone-package/secrets/SecretManager";

interface DataDogConfig {
  enabled: boolean;
  apiKey: string;
  endpoint: string;
}

class DataDogClient {
  gzipAsync = promisify(gzip);

  constructor(private config: DataDogConfig) {}

  public async logHandleResults(metrics: {
    executionTimeMs: number;
    handlerName: string;
    methodName: string;
    messageCount: number;
    message: string;
  }): PromiseGenericResult<string> {
    const shouldLog = Math.floor(Math.random() * 10) === 0;

    if (!shouldLog) {
      return ok("Skipped logging to DataDog");
    }

    try {
      const logPromises = [
        this.logDistributionMetric(
          Date.now(),
          metrics.executionTimeMs,
          `${metrics.handlerName}.handleResults`
        ),
        this.logExecutionTime(
          Date.now(),
          metrics.message,
          metrics.handlerName,
          metrics.methodName,
          metrics.executionTimeMs,
          metrics.messageCount
        ),
      ];

      Promise.allSettled(logPromises).then((results) => {
        results.forEach((result) => {
          if (result.status === "rejected") {
            console.error("Failed to log to DataDog", result.reason);
          }
        });
      });

      return ok("Logged to DataDog");
    } catch (error) {
      return err(`Failed to log to DataDog: ${error}`);
    }
  }

  public async logDistributionMetric(
    timestamp: number,
    executionTimeMs: number,
    handlerName: string
  ): PromiseGenericResult<Response> {
    if (!this.config.enabled) {
      return err(`DataDog logging is disabled`);
    }

    try {
      const distribution = {
        series: [
          {
            metric: "handler.execution_time",
            points: [[timestamp, [executionTimeMs]]],
            host: "kafka_consumer_service",
            tags: ["handler_name:" + handlerName],
          },
        ],
      };

      const requestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Encoding": "string",
          "DD-API-KEY": this.config.apiKey,
        },
        body: JSON.stringify(distribution),
      };

      const response = await fetch(
        `${this.config.endpoint}/v1/distribution_points`,
        requestInit
      );

      return ok(response);
    } catch (e) {
      return err(`Error logging distribution metric: ${e}`);
    }
  }

  public async logExecutionTime(
    timestamp: number,
    message: string,
    handlerName: string,
    methodName: string,
    executionTimeMs: number,
    batchSize: number
  ): PromiseGenericResult<Response> {
    if (!this.config.enabled) {
      return err(`DataDog logging is disabled`);
    }

    try {
      const logEntry = {
        ddsource: "handler_performance",
        ddtags: `handler:${handlerName},method:${methodName}`,
        hostname: "kafka_consumer_service",
        message: message,
        timestamp: new Date(timestamp * 1000).toISOString(),
        handler_name: handlerName,
        method_name: methodName,
        execution_time_ms: executionTimeMs,
        batch_size: batchSize,
      };

      const compressedBody = await this.gzipAsync(JSON.stringify(logEntry));

      const requestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Encoding": "gzip",
          "DD-API-KEY": this.config.apiKey,
        },
        body: compressedBody,
      };

      const response = await fetch(
        `https://http-intake.logs.us5.datadoghq.com/api/v2/logs`,
        requestInit as RequestInit
      );

      return ok(response);
    } catch (e) {
      console.error("Error logging execution time", e);
      return err(`Error logging execution time: ${e}`);
    }
  }
}

export const dataDogClient = new DataDogClient({
  enabled: true,
  apiKey: SecretManager.getSecret("DATADOG_API_KEY") ?? "",
  endpoint: process.env.DATADOG_ENDPOINT ?? "",
});
