import { FilterExpression } from "@helicone-package/filters/types";
import { toFilterNode } from "@helicone-package/filters/toFilterNode";
import { FilterNode } from "@helicone-package/filters/filterDefs";

/**
 * Determines the API base URL and whether it's an EU endpoint
 * @returns Object with baseUrl and isEU flag
 */
function getApiBaseUrl(): { baseUrl: string; isEU: boolean } {
  const jawnService =
    process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE || "http://localhost:8585";

  // Check if the URL contains "eu" to determine if it's an EU endpoint
  const isEU = jawnService.includes("eu.");

  // For production, convert jawn service URL to public API URL
  if (jawnService.includes("localhost")) {
    return {
      baseUrl: "https://api.helicone.ai",
      isEU: false,
    };
  }

  // If it's a jawn service URL, convert it to API URL
  if (jawnService.includes("jawn")) {
    // Replace jawn domain with api domain
    const apiUrl = jawnService.replace(/jawn\./, "api.");
    return {
      baseUrl: apiUrl,
      isEU,
    };
  }

  // Default to api.helicone.ai
  return {
    baseUrl: isEU ? "https://eu.api.helicone.ai" : "https://api.helicone.ai",
    isEU,
  };
}

/**
 * Generates a cURL command for the current filter configuration
 * @param filter - The filter expression to convert
 * @param timeFilter - Optional time filter to include (legacy FilterNode format)
 * @returns A formatted cURL command string
 */
export function generateCurlCommand(
  filter: FilterExpression | null,
  timeFilter?: FilterNode
): string {
  const { baseUrl } = getApiBaseUrl();

  // Convert filter to legacy format
  let filterNode: FilterNode = {} as FilterNode;

  if (filter) {
    filterNode = toFilterNode(filter);
  }

  // Combine with time filter if provided
  let combinedFilter: FilterNode = filterNode;
  if (timeFilter && Object.keys(timeFilter).length > 0) {
    if (Object.keys(filterNode).length > 0) {
      combinedFilter = {
        left: timeFilter,
        operator: "and",
        right: filterNode,
      };
    } else {
      combinedFilter = timeFilter;
    }
  }

  // Create the request body
  const requestBody = {
    filter: combinedFilter,
    limit: 100,
  };

  // Format the cURL command with proper escaping
  const curlCommand = `curl --request POST \\
  --url ${baseUrl}/v1/request/query-clickhouse \\
  --header "Content-Type: application/json" \\
  --header "authorization: Bearer $HELICONE_API_KEY" \\
  --data '${JSON.stringify(requestBody, null, 2)}'`;

  return curlCommand;
}
