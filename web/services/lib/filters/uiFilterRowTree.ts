import { filterListToTree, uiFilterRowToFilterLeaf } from "./filterDefs";

export interface UIFilterRowNode {
  operator: "and" | "or";
  rows: UIFilterRowTree[];
}

export type UIFilterRowTree = UIFilterRowNode | UIFilterRow;

export function filterUITreeToFilterNode(
  filterMap: SingleFilterDef<any>[],
  uiFilterRowNode: UIFilterRowNode
): FilterNode {
  if ("operator" in uiFilterRowNode) {
    const filterNodes = uiFilterRowNode.rows.map((row: UIFilterRowTree) =>
      filterUITreeToFilterNode(filterMap, row)
    );
    return filterListToTree(filterNodes, uiFilterRowNode.operator);
  } else {
    return uiFilterRowToFilterLeaf(uiFilterRowNode);
  }
}
