import type { paths as publicPaths } from "./jawnTypes/public";
import type { paths as privatePaths } from "./jawnTypes/private";
import createClient from "openapi-fetch";
export type JawnFilterNode = any;

export function getJawnClient(orgId?: string | "none") {
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

  return createClient<publicPaths>({
    baseUrl: process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE,
  });
}

export type ClientType = ReturnType<typeof getJawnClient>;
