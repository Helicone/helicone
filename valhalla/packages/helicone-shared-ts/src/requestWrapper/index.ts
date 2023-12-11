import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { Result, err, ok } from "../modules/result";

export type JwtAuth = {
  _type: "jwt";
  token: string;
  orgId?: string;
};

export type BearerAuth = {
  _type: "bearer";
  _bearerType: "heliconeProxyKey" | "heliconeApiKey";
  token: string;
};

export type HeliconeAuth = JwtAuth | BearerAuth;
export class RequestWrapper<T> {
  constructor(private request: ExpressRequest) {}

  public async getBody(): Promise<T> {
    return await this.request.body;
  }

  public authHeader(): Result<HeliconeAuth, string> {
    if (this.request.headers.authorization) {
      return ok({
        _bearerType: "heliconeApiKey",
        token: this.request.headers.authorization,
        _type: "bearer",
      });
    }

    const authHeader = this.request.headers["helicone-authorization"] as string;
    if (!authHeader) {
      return err("No authorization header");
    }

    const parsedAuthHeader = JSON.parse(authHeader) as HeliconeAuth;
    if (
      (parsedAuthHeader._type !== "bearer" &&
        parsedAuthHeader._type !== "jwt") ||
      (parsedAuthHeader._type === "bearer" &&
        !parsedAuthHeader._bearerType &&
        typeof parsedAuthHeader.token !== "string") ||
      (parsedAuthHeader._type === "jwt" &&
        typeof parsedAuthHeader.token !== "string")
    ) {
      return err("Invalid auth header");
    }
    return ok(parsedAuthHeader);
  }
}
