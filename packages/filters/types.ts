export type UIFilterRow = {
  filterMapIdx: number;
  operatorIdx: number;
  value: string;
};
export interface UIFilterRowNode {
  operator: "and" | "or";
  rows: UIFilterRowTree[];
}
export type UIFilterRowTree = UIFilterRowNode | UIFilterRow;
