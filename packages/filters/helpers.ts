import { z } from "zod";
import { TimeFilter, FilterNode, TablesAndViews, FilterLeaf } from "./filterDefs";
import { UIFilterRow, UIFilterRowNode, UIFilterRowTree } from "./types";
import { SingleFilterDef } from "./frontendFilterDefs";

export const TimeFilterSchema = z.object({
  timeFilter: z.object({
    start: z.string().datetime().transform(str => new Date(str)),
    end: z.string().datetime().transform(str => new Date(str)),
  }),
});

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

export function filterListToTree(
  list: FilterNode[],
  operator: "or" | "and"
): FilterNode {
  if (list.length === 0) {
    return "all";
  } else if (list.length === 1) {
    return list[0];
  } else {
    return {
      left: list[0],
      operator,
      right: filterListToTree(list.slice(1), operator),
    };
  }
}

export function isFilterRowNode(
  filter: UIFilterRowTree
): filter is UIFilterRowNode {
  return (filter as UIFilterRowNode).rows !== undefined;
}

export function isUIFilterRow(filter: UIFilterRowTree): filter is UIFilterRow {
  return (filter as UIFilterRow).filterMapIdx !== undefined;
}
export const getRootFilterNode = (): UIFilterRowNode => {
  return {
    operator: "and",
    rows: [],
  };
};

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

  // Special-case: map "AI Gateway" boolean to request_referrer mapping
  if (
    filterDef?.label === "AI Gateway" &&
    filterDef?.table === "request_response_rmt"
  ) {
    const isYes = String(filter.value) === "true";
    return {
      request_response_rmt: {
        request_referrer: {
          equals: isYes ? "ai-gateway" : "__empty__",
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

export function filterUITreeToFilterNode(
  filterMap: SingleFilterDef<any>[],
  uiFilterRowNode: UIFilterRowTree
): FilterNode {
  if ("operator" in uiFilterRowNode) {
    const filterNodes = uiFilterRowNode.rows
      .map((row: UIFilterRowTree) => filterUITreeToFilterNode(filterMap, row))
      .filter((node) => node !== "all");
    return filterListToTree(filterNodes, uiFilterRowNode.operator);
  } else {
    if (uiFilterRowNode.value === "") {
      return "all";
    }
    return uiFilterRowToFilterLeaf(filterMap, uiFilterRowNode);
  }
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