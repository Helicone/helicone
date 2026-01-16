import {
  FilterBranch,
  FilterLeaf,
  FilterNode,
} from "@helicone-package/filters/filterDefs";

/**
 * Transforms search_properties filters to property_key filters.
 * This allows queries to work without ARRAY JOIN.
 *
 * search_properties: { "prop_name": { equals: "prop_name" } }
 * becomes: property_key: { equals: "prop_name" }
 *
 * The search_properties filter requires ARRAY JOIN to create a `key` column,
 * while property_key uses has(mapKeys(properties), 'key') which doesn't need ARRAY JOIN.
 */
export function transformSearchPropertiesToPropertyKey(
  filter: FilterNode
): FilterNode {
  if (filter === "all") {
    return filter;
  }

  // Check if it's a leaf node with search_properties
  if ("request_response_rmt" in filter) {
    const leaf = filter as FilterLeaf;
    const rmt = leaf.request_response_rmt;
    if (rmt && "search_properties" in rmt && rmt.search_properties) {
      // Extract the property key from search_properties
      const propKey = Object.keys(rmt.search_properties)[0];
      if (propKey) {
        // Transform to property_key filter
        return {
          request_response_rmt: {
            property_key: {
              equals: propKey,
            },
          },
        } as FilterLeaf;
      }
    }
    return filter;
  }

  // Check if it's a branch node
  if ("left" in filter && "right" in filter && "operator" in filter) {
    const branch = filter as FilterBranch;
    return {
      left: transformSearchPropertiesToPropertyKey(branch.left),
      right: transformSearchPropertiesToPropertyKey(branch.right),
      operator: branch.operator,
    };
  }

  return filter;
}
