import { useQuery } from "@tanstack/react-query";

import { getJawnClient } from "../../../lib/clients/jawn";
import { Result } from "@/lib/result";
import { HeliconeRequest } from "@/lib/api/request/request";
import { mapGeminiPro } from "../requestsV2/builder/mappers/geminiMapper";
import getNormalizedRequest from "../requestsV2/builder/requestBuilder";

const useClustersPage = (orgId: string) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["clusters"],
    queryFn: async () => {
      const jawn = getJawnClient();
      const res = await jawn.POST("/v1/request/clusters", {
        body: {
          filter: "all",
        },
      });

      if (res.error || !res.data) {
        return {
          clusters: [],
        };
      }

      const clusters = await Promise.all(
        res.data.data?.map(async (c) => {
          const contentResponse = await fetch(c.signed_body_url);
          if (contentResponse.ok) {
            const text = await contentResponse.text();
            let content = JSON.parse(text);
            return {
              ...c,
              content: content.request,
            };
          }
          return null;
        }) ?? []
      );

      return {
        clusters,
      };
    },
  });

  return {
    clusters: data?.clusters || [],
    isLoading,
    refetch,
  };
};

export const useRequest = (requestId: string) => {
  const {
    data,
    isLoading: isRequestLoading,
    refetch: refetchRequest,
  } = useQuery({
    queryKey: ["request", requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const jawn = getJawnClient();
      const res = await jawn.POST(`/v1/request/request/{requestId}`, {
        params: {
          path: {
            requestId,
          },
        },
      });

      if (res.error || !res.data) {
        return {
          request: null,
        };
      }

      return res.data as Result<HeliconeRequest, string>;
    },
  });

  const request = data && "data" in data ? data.data : null;

  const urlQuery = useQuery({
    queryKey: ["request-content", request?.signed_body_url],
    queryFn: async () => {
      if (!request?.signed_body_url) return null;
      const contentResponse = await fetch(request.signed_body_url);
      if (contentResponse.ok) {
        const text = await contentResponse.text();
        let content = JSON.parse(text);
        return content;
      }
      return null;
    },
  });

  const content = urlQuery.data;
  if (!content) {
    return {
      request,
      isLoading: isRequestLoading,
      refetch: refetchRequest,
    };
  }

  const model =
    request?.model_override ||
    request?.response_model ||
    request?.request_model ||
    content.response?.model ||
    content.request?.model ||
    content.response?.body?.model ||
    "";

  let updatedRequest = {
    ...request,
    request_body: content.request,
    response_body: content.response,
  };

  if (
    request?.provider === "GOOGLE" &&
    model.toLowerCase().includes("gemini")
  ) {
    updatedRequest.llmSchema = mapGeminiPro(
      updatedRequest as HeliconeRequest,
      model
    );
  }

  return {
    request,
    isLoading: isRequestLoading,
    refetch: refetchRequest,
    updatedRequest,
    normalizedRequest: getNormalizedRequest(updatedRequest as HeliconeRequest),
    // isUrlsFetching: urlQuery.isFetching,
  };
};

export default useClustersPage;
