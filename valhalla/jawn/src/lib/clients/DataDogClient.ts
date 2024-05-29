interface DataDogConfig {
  enabled: boolean;
  apiKey: string;
  endpoint: string;
}

class DataDogClient {
  constructor(private config: DataDogConfig) {}

  public async logDistributionMetric(
    timestamp: number,
    executionTimeMs: number,
    handlerName: string,
    batchSize?: number
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
            batch_size: batchSize,
          },
        ],
      };

      if (batchSize) {
        distribution.series[0].points = distribution.series[0].points.slice(
          0,
          batchSize
        );
      }

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
}

export const dataDogClient = new DataDogClient({
  enabled: true,
  apiKey: process.env.DATADOG_API_KEY ?? "",
  endpoint: process.env.DATADOG_ENDPOINT ?? "",
});
