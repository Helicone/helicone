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

export type {
  FilterExpression,
  AllExpression,
  ConditionExpression,
  AndExpression,
  OrExpression,
  FilterOperator,
  FieldSpec,
  RequestResponseRMT,
  FilterSubType,
  Views,
  UserMetric,
} from "./filterExpressions";

export {
  FilterAST,
  DEFAULT_FILTER_EXPRESSION,
  DEFAULT_FILTER_GROUP_EXPRESSION,
  EMPTY_FILTER_GROUP_EXPRESSION,
} from "./filterExpressions";