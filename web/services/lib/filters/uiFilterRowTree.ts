import { UIFilterRow } from "../../../components/shared/themed/themedAdvancedFilters";
import {
  filterListToTree,
  FilterNode,
  uiFilterRowToFilterLeaf,
} from "./filterDefs";
import { SingleFilterDef } from "./frontendFilterDefs";

export interface UIFilterRowNode {
  operator: "and" | "or";
  rows: UIFilterRowTree[];
}

export type UIFilterRowTree = UIFilterRowNode | UIFilterRow;

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
