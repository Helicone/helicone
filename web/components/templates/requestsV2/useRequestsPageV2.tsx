import { useCallback } from "react";
import { HeliconeRequest } from "../../../lib/api/request/request";
import { useGetProperties } from "../../../services/hooks/properties";
import { useGetRequests } from "../../../services/hooks/requests";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import AbstractRequestBuilder from "./builder/abstractRequestBuilder";
import ChatGPTBuilder from "./builder/ChatGPTBuilder";
import GPT3Builder from "./builder/GPT3Builder";
import getRequestBuilder from "./builder/requestBuilder";

const useRequestsPageV2 = (
  currentPage: number,
  currentPageSize: number,
  sortLeaf: SortLeafRequest
) => {
  const { requests, count } = useGetRequests(
    currentPage,
    currentPageSize,
    {},
    sortLeaf
  );

  const { properties, isLoading: isPropertiesLoading } = useGetProperties();

  const isLoading =
    requests.isLoading || count.isLoading || isPropertiesLoading;

  const getNormalizedRequests = useCallback(() => {
    const rawRequests = requests.data?.data || [];
    return rawRequests.map((request) => {
      const builder = getRequestBuilder(request);
      return builder.build();
    });
  }, [requests]);

  const normalizedRequests = getNormalizedRequests();

  return {
    requests: normalizedRequests,
    count: count.data?.data,
    isLoading,
    properties,
    refetch: requests.refetch,
  };
};

export default useRequestsPageV2;
