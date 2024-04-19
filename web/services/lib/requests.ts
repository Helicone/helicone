import Cookies from "js-cookie";
import { SUPABASE_AUTH_TOKEN } from "../../lib/constants";
import { getJawnClient } from "../../lib/clients/jawn";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const API_BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH || "";

export const updateRequestFeedback = async (
  requestId: string,
  rating: boolean
) => {
  const jawn = getJawnClient();

  return (
    await jawn.POST("/v1/request/{requestId}/feedback", {
      params: {
        path: { requestId },
      },
      body: {
        rating,
      },
    })
  ).response;
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

  return fetch(`${API_BASE_PATH}/request/${requestId}/property`, {
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
