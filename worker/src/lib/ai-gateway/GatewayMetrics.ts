import { DataDogClient } from "../monitoring/DataDogClient";

export class GatewayMetrics {
  private readonly startTime: number;
  private preRequestEndTime: number | null = null;
  private promptRequestStartTime: number | null = null;
  private providerStartTime: number | null = null;
  private providerEndTime: number | null = null;

  constructor(private readonly dataDogClient: DataDogClient) {
    this.startTime = performance.now();
  }

  markPromptRequestStart(): void {
    this.promptRequestStartTime = performance.now();
  }

  markPromptRequestEnd(): void {
    if (this.promptRequestStartTime === null) {
      console.error("Prompt request start time not marked");
      return;
    }
    const promptRequestEndTime = performance.now();
    const promptRequestLatency =
      promptRequestEndTime - this.promptRequestStartTime;
    this.dataDogClient.trackLatency("prompt_request_ms", promptRequestLatency);
  }

  markPreRequestEnd(): void {
    this.preRequestEndTime = performance.now();
    const preRequestLatency = this.preRequestEndTime - this.startTime;
    this.dataDogClient.trackLatency("pre_request_ms", preRequestLatency);
  }

  markProviderStart(): void {
    this.providerStartTime = performance.now();
  }

  markProviderEnd(statusCode: number): void {
    if (this.providerStartTime === null) {
      console.error("Provider start time not marked");
      return;
    }
    this.providerEndTime = performance.now();

    if (statusCode === 429) {
      this.dataDogClient.trackProviderRateLimit();
    }

    if (statusCode >= 200 && statusCode < 300) {
      const providerLatency = this.providerEndTime - this.providerStartTime;
      this.dataDogClient.trackLatency("provider_request_ms", providerLatency);
    }
  }

  markPostRequestEnd(): void {
    if (this.providerEndTime === null) {
      return;
    }
    const postRequestEndTime = performance.now();
    const postRequestLatency = postRequestEndTime - this.providerEndTime;
    this.dataDogClient.trackLatency("post_request_ms", postRequestLatency);

    const totalLatency = postRequestEndTime - this.startTime;
    this.dataDogClient.trackLatency("total_ms", totalLatency);
  }
}
