import Cookies from "js-cookie";
import createClient from "openapi-fetch";
import { ORG_ID_COOKIE_KEY } from "../constants";
import { getHeliconeCookie } from "../cookies";
import type { paths as publicPaths, components } from "./jawnTypes/public";
import type { paths as privatePaths } from "./jawnTypes/private";

export type JawnFilterNode = components["schemas"]["FilterNode"];

export function getJawnClient(orgId?: string) {
  orgId = orgId || Cookies.get(ORG_ID_COOKIE_KEY);

  const jwtToken = getHeliconeCookie().data?.jwtToken;
  return createClient<publicPaths & privatePaths>({
    baseUrl: process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE,
    headers: {
      "helicone-authorization": JSON.stringify({
        _type: "jwt",
        token: jwtToken,
        orgId: orgId,
      }),
    },
  });
}

export type ClientType = ReturnType<typeof getJawnClient>;
