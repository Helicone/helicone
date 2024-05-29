interface DataDogConfig {
  enabled: boolean;
  apiKey: string;
  endpoint: string;
}

class DataDogClient {
  constructor(private config: DataDogConfig) {}

  public async logHandleResults(metrics: {
    executionTimeMs: number;
    handlerName: string;
    methodName: string;
    messageCount: number;
    message: string;
  }): Promise<void> {
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
    } catch (error) {
      console.error("Failed to initiate logging to DataDog", error);
    }
  }

  public async logDistributionMetric(
    timestamp: number,
    executionTimeMs: number,
    handlerName: string
  ): Promise<Response> {
    if (!this.config.enabled) {
      return new Response("DataDog logging is disabled", {
        status: 200,
      });
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

      return response;
    } catch (e) {
      console.error("Error logging distribution metric", e);
      return new Response("Error logging distribution metric", {
        status: 500,
      });
    }
  }

  public async logExecutionTime(
    timestamp: number,
    message: string,
    handlerName: string,
    methodName: string,
    executionTimeMs: number,
    batchSize: number
  ): Promise<Response> {
    if (!this.config.enabled) {
      return new Response("DataDog logging is disabled", {
        status: 200,
      });
    }

    try {
      const logEntry = {
        ddsource: "handler_performance",
        ddtags: `handler:${handlerName},method:${methodName}`,
        message: message,
        timestamp: new Date(timestamp * 1000).toISOString(),
        handler_name: handlerName,
        method_name: methodName,
        execution_time_ms: executionTimeMs,
        batch_size: batchSize,
      };

      const requestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "DD-API-KEY": this.config.apiKey,
        },
        body: JSON.stringify(logEntry),
      };

      const response = await fetch(
        `${this.config.endpoint}/v2/logs`,
        requestInit
      );

      return response;
    } catch (e) {
      console.error("Error logging execution time", e);
      return new Response("Error logging execution time", {
        status: 500,
      });
    }
  }
}

export const dataDogClient = new DataDogClient({
  enabled: true,
  apiKey: process.env.DATADOG_API_KEY ?? "",
  endpoint: process.env.DATADOG_ENDPOINT ?? "",
});
