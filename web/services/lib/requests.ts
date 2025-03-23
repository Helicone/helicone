import { getJawnClient } from "../../lib/clients/jawn";

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

export const addRequestProperty = async (
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

export const addRequestScore = async (
  requestId: string,
  orgId: string,
  key: string,
  value: number | boolean
) => {
  const jawn = getJawnClient(orgId);
  return (
    await jawn.POST("/v1/request/{requestId}/score", {
      body: {
        scores: {
          [key]: value,
        },
      },
      params: {
        path: {
          requestId,
        },
      },
    })
  ).response;
};
