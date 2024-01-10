import {
  SingleKey,
  TextOperators,
  TimestampOperators,
} from "../../../../services/lib/filters/filterDefs";
import {
  TextOperators as GQLTextOperators,
  DateOperators,
} from "../schema/types/graphql";

export function convertTextOperators(
  op: GQLTextOperators
): SingleKey<TextOperators> {
  if (op.not_equals !== undefined) {
    return { "not-equals": op.not_equals ?? "" };
  } else {
    return { ...op } as SingleKey<TextOperators>;
  }
}

export function convertTimeOperators(
  op: DateOperators
): SingleKey<TimestampOperators> {
  if (op.gte) {
    return { gte: op.gte };
  } else if (op.lte) {
    return { lte: op.lte };
  } else if (op.lt) {
    return { lt: op.lt };
  } else if (op.gt) {
    return { gt: op.gt };
  }
  throw new Error("Invalid date operator");
}
