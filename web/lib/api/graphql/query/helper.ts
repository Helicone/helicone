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
  } else if (op.like !== undefined) {
    return { like: op.like ?? "" };
  } else if (op.ilike !== undefined) {
    return { ilike: op.ilike ?? "" };
  } else if (op.equals !== undefined) {
    return { equals: op.equals ?? "" };
  } else if (op.contains !== undefined) {
    return { contains: op.contains ?? "" };
  } else if (op.not_contains !== undefined) {
    return { "not-contains": op.not_contains ?? "" };
  } else if (op.is_null !== undefined) {
    return { "is-null": true };
  } else if (op.is_not_null !== undefined) {
    return { "is-not-null": true };
  } else if (op.is_empty !== undefined) {
    return { "is-empty": true };
  } else if (op.is_not_empty !== undefined) {
    return { "is-not-empty": true };
  }
  throw new Error("Invalid text operator");
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
  } else if (op.is_null !== undefined) {
    return { "is-null": true };
  }
  throw new Error("Invalid date operator");
}
