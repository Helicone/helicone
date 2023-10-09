import { ApolloError } from "apollo-server-errors";
import { Context } from "../../../../pages/api/graphql";
import {
  FilterLeaf,
  filterListToTree,
  FilterNode,
  SingleKey,
  TablesAndViews,
  TextOperators,
  TimestampOperators,
} from "../../../../services/lib/filters/filterDefs";
import { getRequests } from "../../request/request";
import { getOrgIdOrThrow, getUserOrThrow } from "../helpers/auth";
import {
  HeliconeRequest,
  QueryHeliconeRequestArgs,
  HeliconeRequestFilter,
  TextOperators as GQLTextOperators,
  PropertyFilter,
  DateOperators,
} from "../schema/types/graphql";
import { modelCost } from "../../metrics/costCalc";

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
  }
  throw new Error("Invalid date operator");
}
