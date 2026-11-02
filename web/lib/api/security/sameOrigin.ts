import type { NextApiRequest, NextApiResponse } from "next";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function hostOf(url: string | undefined): string | null {
  if (!url) {
    return null;
  }
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Hosts this app is served from: the Host the browser addressed (set by the
 * browser, so a cross-site page cannot forge it on the victim's request) and,
 * when configured, the canonical app URL.
 */
function allowedHosts(req: NextApiRequest): Set<string> {
  const hosts = new Set<string>();
  const forwardedHost = firstHeader(req.headers["x-forwarded-host"]);
  const host = firstHeader(req.headers.host);
  for (const h of [forwardedHost, host]) {
    if (h) {
      hosts.add(h.split(",")[0].trim().toLowerCase());
    }
  }
  const appHost = hostOf(process.env.NEXT_PUBLIC_APP_URL);
  if (appHost) {
    hosts.add(appHost);
  }
  return hosts;
}

/**
 * CSRF guard for cookie-authenticated, state-changing API routes.
 *
 * Safe methods always pass. For anything else the request must come from this
 * app's own origin: `Sec-Fetch-Site` (when the browser sends it) must be
 * `same-origin`, and `Origin` (or `Referer` as a fallback) must point at one of
 * this app's hosts. Requests carrying neither header are rejected: every
 * browser that could be used for CSRF sends at least one of them.
 */
export function isSameOriginRequest(req: NextApiRequest): boolean {
  const method = (req.method ?? "GET").toUpperCase();
  if (SAFE_METHODS.has(method)) {
    return true;
  }

  const fetchSite = firstHeader(req.headers["sec-fetch-site"]);
  if (fetchSite !== undefined && fetchSite !== "same-origin") {
    return false;
  }

  const origin = firstHeader(req.headers.origin);
  const referer = firstHeader(req.headers.referer);

  // "null" is sent for opaque origins (sandboxed iframes, data: URLs, ...).
  if (origin !== undefined && origin !== "null") {
    const originHost = hostOf(origin);
    return originHost !== null && allowedHosts(req).has(originHost);
  }
  if (origin === "null") {
    return false;
  }

  if (referer !== undefined) {
    const refererHost = hostOf(referer);
    return refererHost !== null && allowedHosts(req).has(refererHost);
  }

  // No Origin and no Referer: only trust it if the browser told us via
  // Sec-Fetch-Site that it is same-origin.
  return fetchSite === "same-origin";
}

/**
 * Wrap a Next.js API handler so that cross-site state-changing requests are
 * rejected with 403 before the handler (and its auth lookup) runs.
 */
export function withSameOrigin<
  Req extends NextApiRequest,
  Res extends NextApiResponse,
>(handler: (req: Req, res: Res) => unknown | Promise<unknown>) {
  return async (req: Req, res: Res) => {
    if (!isSameOriginRequest(req)) {
      res
        .status(403)
        .json({ error: "Cross-site request rejected", data: null });
      return;
    }
    return handler(req, res);
  };
}
