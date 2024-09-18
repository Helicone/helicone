import Cookies from "js-cookie";
import createClient from "openapi-fetch";
import { ORG_ID_COOKIE_KEY } from "../constants";
import { getHeliconeCookie } from "../cookies";
import type { paths as publicPaths } from "./jawnTypes/public";
import type { paths as privatePaths } from "./jawnTypes/private";

export type JawnFilterNode = any;

export function getJawnClient(orgId?: string | "none") {
  orgId = orgId || Cookies.get(ORG_ID_COOKIE_KEY);
  console.log("orgId", orgId);
  const jwtToken = getHeliconeCookie().data?.jwtToken;
  console.log("jwtToken", jwtToken);
  const headers =
    orgId !== "none"
      ? {
          "helicone-authorization": JSON.stringify({
            _type: "jwt",
            token: jwtToken,
            orgId: orgId,
          }),
        }
      : {};

  return createClient<publicPaths & privatePaths>({
    baseUrl: process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE,
    headers,
  });
}

export type ClientType = ReturnType<typeof getJawnClient>;
