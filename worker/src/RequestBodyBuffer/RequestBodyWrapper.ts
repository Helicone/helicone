import { DataDogClient } from "../lib/monitoring/DataDogClient";

// NEVER give the user direct access to the body
export class RequestBodyBuffer {
  private cachedText: string | null = null;

  constructor(
    private request: Request,
    private dataDogClient: DataDogClient | undefined
  ) {}

  // TODO remove this function in later phases
  public tempSetBody(body: string): void {
    this.cachedText = body;
  }

  // super unsafe and should only be used for cases we know will be smaller bodies
  async unsafeGetRawText(): Promise<string> {
    if (this.cachedText) {
      return this.cachedText;
    }
    this.cachedText = await this.request.text();
    try {
      if (this.dataDogClient) {
        const sizeBytes = DataDogClient.estimateStringSize(this.cachedText);
        this.dataDogClient.trackMemory("request-body", sizeBytes);
      }
    } catch (e) {
      // Silently catch - never let monitoring break the request
    }
    return this.cachedText;
  }
}
