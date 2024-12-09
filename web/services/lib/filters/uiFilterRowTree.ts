import { UIFilterRow, UIFilterRowNode, UIFilterRowTree } from "./types";
import { FilterNode } from "./filterDefs";
import { uiFilterRowToFilterLeaf } from "./helpers/filterFunctions";
import { filterListToTree } from "./filterListToTree";
import { SingleFilterDef } from "./frontendFilterDefs";

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
