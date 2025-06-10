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

  const region = process.env.REGION || "us";
  return createClient<publicPaths>({
    baseUrl:
      process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE ||
      (process.env.NODE_ENV === "development"
        ? "http://localhost:8585"
        : region === "eu"
        ? "https://eu.api.helicone.ai"
        : "https://api.helicone.ai"),
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

export type ClientType = ReturnType<typeof getJawnClient>;
