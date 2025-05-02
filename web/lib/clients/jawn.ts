import Cookies from "js-cookie";
import { env } from "next-runtime-env";
import createFetchClient from "openapi-fetch";
import createQueryClient from "openapi-react-query";
import { ORG_ID_COOKIE_KEY } from "../constants";
import { getHeliconeCookie } from "../cookies";
import type { paths as privatePaths } from "./jawnTypes/private";
import type { paths as publicPaths } from "./jawnTypes/public";

type allPaths = publicPaths & privatePaths;

export function getJawnClient(orgId?: string | "none") {
  return createFetchClient<allPaths>({
    baseUrl: env("NEXT_PUBLIC_HELICONE_JAWN_SERVICE"),
    fetch: (request: Request) => {
      // Read cookies on each request to get latest values
      const currentOrgId = orgId || Cookies.get(ORG_ID_COOKIE_KEY);
      const jwtToken = getHeliconeCookie().data?.jwtToken ?? "";

      // Get existing headers
      const existingHeaders = Object.fromEntries(request.headers.entries());

      // Add auth header if an org is selected
      const headers = { ...existingHeaders };
      if (currentOrgId !== "none") {
        headers["helicone-authorization"] = JSON.stringify({
          _type: "jwt",
          token: jwtToken,
          orgId: currentOrgId ?? "no-org-id",
        });
      }

      // Clone the request to modify it
      const newRequest = new Request(request, {
        headers,
      });

      return fetch(newRequest, {
        credentials: "include",
      });
    },
  });
}

const jawnClient = getJawnClient();

export const $JAWN_API = {
  ...jawnClient,
  ...createQueryClient<allPaths>(jawnClient),
};

export const $JAWN_API_WITH_ORG = (orgId?: string | "none") => {
  const client = getJawnClient(orgId);
  return {
    ...client,
    ...createQueryClient<allPaths>(client),
  };
};

export type ClientType = ReturnType<typeof getJawnClient>;
