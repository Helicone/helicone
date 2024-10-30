import { placeAssetIdValues } from "../../../../../../services/lib/requestTraverseHelper";

export const fetchRequestResponseBody = async (
  request_response: any,
  responseBodyCache: any
) => {
  // Check cache first
  if (
    request_response.request_id &&
    responseBodyCache.current[request_response.request_id]
  ) {
    return responseBodyCache.current[request_response.request_id];
  }

  if (!request_response.signed_body_url) return null;

  try {
    const contentResponse = await fetch(request_response.signed_body_url);
    if (contentResponse.ok) {
      const text = await contentResponse.text();
      let content = JSON.parse(text);
      if (request_response.asset_urls) {
        content = placeAssetIdValues(request_response.asset_urls, content);
      }
      // Store in cache
      if (request_response.request_id) {
        responseBodyCache.current[request_response.request_id] = content;
      }
      return content;
    }
  } catch (error) {
    console.error("Error fetching response body:", error);
  }
  return null;
};
