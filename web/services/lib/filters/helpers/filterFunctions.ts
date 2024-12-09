import { UIFilterRow } from "../types";
import {
  FilterLeaf,
  FilterNode,
  TablesAndViews,
  TimeFilter,
} from "../filterDefs";
import { SingleFilterDef } from "../frontendFilterDefs";
import { UIFilterRowTree } from "../types";

export function uiFilterRowToFilterLeaf(
  filterMap: SingleFilterDef<any>[],
  filter: UIFilterRow
): FilterLeaf {
  const filterDef = filterMap[filter.filterMapIdx];
  const operator = filterDef?.operators[filter.operatorIdx]?.value;

  if (filterDef?.isCustomProperty) {
    return {
      request_response_rmt: {
        properties: {
          [filterDef.column]: {
            [operator]: filter.value,
          },
        },
      },
    };
  }

  if (
    filterDef?.column === "helicone-score-feedback" &&
    filterDef?.table === "request_response_rmt" &&
    filterDef?.category === "feedback"
  ) {
    return {
      request_response_rmt: {
        scores: {
          [filterDef.column]: {
            [operator]: filter.value === "true" ? "1" : "0",
          },
        },
      },
    };
  }

  return {
    [filterDef?.table]: {
      [filterDef?.column]: {
        [operator]: filter.value,
      },
    },
  };
}
export function timeFilterToFilterNode(
  filter: TimeFilter,
  table: keyof TablesAndViews
): FilterNode {
  if (table === "request_response_rmt") {
    return {
      left: {
        request_response_rmt: {
          request_created_at: {
            gte: filter.start,
          },
        },
      },
      right: {
        request_response_rmt: {
          request_created_at: {
            lte: filter.end,
          },
        },
      },
      operator: "and",
    };
  } else if (table === "property_with_response_v1") {
    return {
      left: {
        property_with_response_v1: {
          request_created_at: {
            gte: filter.start,
          },
        },
      },
      right: {
        property_with_response_v1: {
          request_created_at: {
            lte: filter.end,
          },
        },
      },
      operator: "and",
    };
  } else if (table === "rate_limit_log") {
    return {
      left: {
        rate_limit_log: {
          created_at: {
            gte: filter.start,
          },
        },
      },
      right: {
        rate_limit_log: {
          created_at: {
            lte: filter.end,
          },
        },
      },
      operator: "and",
    };
  }

  throw new Error("Table not supported");
}
export function filterUIToFilterLeafs(
  filterMap: SingleFilterDef<any>[],
  filters: UIFilterRow[]
): FilterLeaf[] {
  return filters
    .filter((filter) => filter.value !== "")
    .map((filter) => uiFilterRowToFilterLeaf(filterMap, filter));
}
export function uiFilterRowTreeToFilterLeafArray(
  filterMap: SingleFilterDef<any>[],
  tree: UIFilterRowTree
): FilterLeaf[] {
  let filterLeafArray: FilterLeaf[] = [];

  const traverseTree = (node: UIFilterRowTree) => {
    if ("rows" in node) {
      node.rows.forEach((childNode) => traverseTree(childNode));
    } else {
      const filterLeaf = uiFilterRowToFilterLeaf(filterMap, node);
      filterLeafArray.push(filterLeaf);
    }
  };

  traverseTree(tree);
  return filterLeafArray;
}
export const parseKey = (keyString: string): FilterLeaf => {
  return {
    request: {
      auth_hash: {
        equals: keyString,
      },
    },
  };
};
