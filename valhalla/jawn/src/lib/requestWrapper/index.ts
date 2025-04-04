import { Request as ExpressRequest } from "express";
import { Result, err, ok } from "../../packages/common/result";
import { HeliconeAuth } from "../../packages/common/auth/types";

function isValidHeliconeAuth(auth: HeliconeAuth): boolean {
  if (typeof auth._type !== "string") {
    return false;
  }
  if (auth._type === "bearerProxy") {
    return typeof auth.token === "string";
  }
  if (auth._type === "bearer") {
    return typeof auth.token === "string";
  }
  if (auth._type === "jwt") {
    return typeof auth.token === "string" && typeof auth.orgId === "string";
  }
  return false;
}

export class RequestWrapper<T> {
  constructor(private request: ExpressRequest) {}

  public getRawQuery() {
    return this.request.query;
  }

  public getParams() {
    return this.request.params;
  }

  public async getRawBody<T>(): Promise<T> {
    return await this.request.body;
  }

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
    try {
      const parsedAuthHeader = JSON.parse(authHeader) as HeliconeAuth;
      if (!isValidHeliconeAuth(parsedAuthHeader)) {
        return err("Invalid auth header format");
      }
      return ok(parsedAuthHeader);
    } catch (e) {
      return err("Invalid auth header");
    }
  }
}
