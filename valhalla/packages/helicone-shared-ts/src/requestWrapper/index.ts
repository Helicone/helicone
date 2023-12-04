import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";

export class RequestWrapper<T> {
  constructor(private request: ExpressRequest) {}

  public async getBody(): Promise<T> {
    return await this.request.body;
  }

  public authHeader(): string | undefined {
    return this.request.headers.authorization;
  }

  public heliconeOrgId(): string | undefined {
    return (this.request.headers["helicone-org-id"] as string) ?? undefined;
  }
}
