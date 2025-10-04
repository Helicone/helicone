import { Request as ExpressRequest } from "express";

export function toExpressRequest(req: {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  url?: string;
}): ExpressRequest {
  return {
    method: req.method!,
    headers: req.headers!,
    body: "{}",
    get: function (this: { headers: any }, name: string) {
      return this.headers[name];
    },
    header: function (this: { headers: any }, name: string) {
      return this.headers[name];
    },
    is: function () {
      return false;
    },
    protocol: "http",
    secure: false,
    ip: "::1",
    ips: [],
    subdomains: [],
    hostname: "localhost",
    host: "localhost",
    fresh: false,
    stale: true,
    xhr: false,
    cookies: {},
    signedCookies: {},
    query: {},
    route: {},
    originalUrl: req.url,
    baseUrl: "",
    next: function () {},
  } as unknown as ExpressRequest;
}
