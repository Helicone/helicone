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
  const jawn = getJawnClient(orgId);
  return (
    await jawn.PUT("/v1/request/{requestId}/property", {
      body: {
        key,
        value,
      },
      params: {
        path: {
          requestId,
        },
      },
    })
  ).response;
};
