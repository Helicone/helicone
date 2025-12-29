import type { paths as publicPaths } from "./jawnTypes/public";
import type { paths as privatePaths } from "./jawnTypes/private";
import createClient from "openapi-fetch";
export type JawnFilterNode = any;

export function getJawnClient(apiKey?: string) {
  // const jwtToken = getHeliconeCookie().data?.jwtToken;
  // const headers =
  //   orgId !== "none"
  //     ? {
  //         "helicone-authorization": JSON.stringify({
  //           _type: "jwt",
  //           token: jwtToken,
  //           orgId: orgId,
  //         }),
  //       }
  //     : {};

  const getJawnServiceUrl = () => {
    if (process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE) {
      return process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE;
    }
    // Fallback to NEXT_PUBLIC_APP_URL with Jawn port
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    try {
      const url = new URL(appUrl);
      return `${url.protocol}//${url.hostname}:8585`;
    } catch {
      return "http://localhost:8585";
    }
  };

  return createClient<publicPaths>({
    baseUrl: getJawnServiceUrl(),
    headers: apiKey
      ? {
          Authorization: `Bearer ${apiKey}`,
        }
      : {},
  });
}

export type ClientType = ReturnType<typeof getJawnClient>;
