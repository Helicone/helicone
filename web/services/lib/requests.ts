import Cookies from "js-cookie";
import { Database } from "../../supabase/database.types";
import { SUPABASE_AUTH_TOKEN } from "../../lib/constants";

export type ResponseAndRequest = Omit<
  Database["public"]["Views"]["response_and_request_rbac"]["Row"],
  "response_body" | "request_body"
> & {
  response_body: {
    choices:
      | {
          text: any;
          logprobs: {
            token_logprobs: number[];
          };
        }[]
      | null;
    usage:
      | {
          total_tokens: number;
        }
      | null
      | undefined;
    model: string;
    error?: any;
  } | null;
  request_body: {
    prompt: string;
    max_tokens: number;
    model: string;
    temperature: number;
  } | null;
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const updateRequestFeedback = async (
  requestId: string,
  rating: boolean
) => {
  const authFromCookie = Cookies.get(SUPABASE_AUTH_TOKEN);
  if (!authFromCookie) {
    console.error("No auth token found in cookie");
    return;
  }
  const decodedCookie = decodeURIComponent(authFromCookie);
  const parsedCookie = JSON.parse(decodedCookie);
  const jwtToken = parsedCookie[0];

  return fetch(`${BASE_PATH}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "helicone-jwt": jwtToken,
    },
    body: JSON.stringify({
      "helicone-id": requestId,
      rating: rating,
    }),
  });
};

export const addRequestLabel = async (
  requestId: string,
  orgId: string,
  key: string,
  value: string
) => {
  const authFromCookie = Cookies.get(SUPABASE_AUTH_TOKEN);
  if (!authFromCookie) {
    console.error("No auth token found in cookie");
    return;
  }
  const decodedCookie = decodeURIComponent(authFromCookie);
  const parsedCookie = JSON.parse(decodedCookie);
  const jwtToken = parsedCookie[0];

  return fetch(`${BASE_PATH}/request/${requestId}/property`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "helicone-jwt": jwtToken,
      "helicone-org-id": orgId,
    },
    body: JSON.stringify({
      key,
      value,
    }),
  });
};
