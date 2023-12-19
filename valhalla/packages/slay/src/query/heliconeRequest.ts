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
import { convertTextOperators, convertTimeOperators } from "./helper";
import { HeliconeQueryResolvers } from "..";

const filterInputToFilterLeaf: {
  [key in keyof HeliconeRequestFilter]: (
    filter: HeliconeRequestFilter[key]
  ) => FilterLeaf | undefined;
} = {
  feedback: (feedback) => {
    if (
      feedback === undefined ||
      feedback === null ||
      feedback.rating === null
    ) {
      return undefined;
    }
    return {
      feedback: {
        rating: {
          equals: feedback.rating,
        },
      },
    };
  },
  requestId: (requestId) => {
    if (requestId === undefined || requestId === null) {
      return undefined;
    }
    return {
      request: {
        id: convertTextOperators(requestId),
      },
    };
  },
  property: (property) => {
    if (property === undefined || property === null) {
      return undefined;
    }
    return {
      properties: {
        [property.name]: convertTextOperators(property.value),
      },
    };
  },
  prompt: (prompt) => {
    if (prompt === undefined || prompt === null) {
      return undefined;
    }
    return {
      request: {
        prompt: convertTextOperators(prompt),
      },
    };
  },
  response: (response) => {
    if (response === undefined || response === null) {
      return undefined;
    }
    return {
      response: {
        body_completion: convertTextOperators(response),
      },
    };
  },
  user: (user) => {
    if (user === undefined || user === null) {
      return undefined;
    }
    return {
      request: {
        user_id: convertTextOperators(user),
      },
    };
  },
  createdAt: (createdAt) => {
    if (createdAt === undefined || createdAt === null) {
      return undefined;
    }
    return {
      request: {
        created_at: convertTimeOperators(createdAt),
      },
    };
  },
};

function convertFilterInputToFilterLeaf(
  filter: HeliconeRequestFilter
): FilterNode {
  const keys = Object.keys(filter) as (keyof HeliconeRequestFilter)[];
  const convertedFilters = keys
    .map((key) => {
      const toLeaf = filterInputToFilterLeaf[key];
      if (toLeaf === undefined) {
        return undefined;
      }
      return toLeaf(filter[key] as any);
    })
    .filter((f): f is FilterLeaf => f !== undefined);
  return filterListToTree(convertedFilters, "and");
}

export const heliconeRequest: HeliconeQueryResolvers["heliconeRequest"] =
  async (root, args, context, info) => {
    const orgId = await context.getOrgIdOrThrow();
    const { limit, offset, filters } = {
      limit: args.limit ?? 100,
      offset: args.offset ?? 0,
      filters: args.filters ?? [],
    };

    // Convert GraphQL filter inputs to TypeScript filters
    const convertedFilters: FilterNode[] = filters.map((f) =>
      convertFilterInputToFilterLeaf(f)
    );
    const filter = filterListToTree(convertedFilters, "and");

    const { data, error } = await getRequests(orgId, filter, offset, limit, {
      created_at: "desc",
    });

    if (error !== null) {
      throw new ApolloError(error, "UNAUTHENTICATED");
    }

    return data.map((r) => ({
      id: r.request_id,
      createdAt: r.request_created_at,
      model: r.response_body?.model ?? r.request_body?.model ?? null,
      costUSD: modelCost({
        model: r.response_body?.model ?? r.request_body?.model ?? null,
        sum_completion_tokens: r.completion_tokens ?? 0,
        sum_prompt_tokens: r.prompt_tokens ?? 0,
        sum_tokens: (r.total_tokens ?? 0) + (r.completion_tokens ?? 0),
      }),
      prompt: r.request_prompt,
      response: r.response_prompt,
      user: r.request_user_id
        ? {
            id: r.request_user_id,
          }
        : null,
      properties: r.request_properties
        ? Object.entries(r.request_properties).map(([k, v]) => ({
            name: k,
            value: v as string,
          }))
        : [],
      values: r.request_prompt_values
        ? Object.entries(r.request_prompt_values).map(([k, v]) => ({
            name: k,
            value: v as string,
          }))
        : [],
      requestBody: r.request_body,
      responseBody: r.response_body,
      latency: r.delay_ms,
      feedback: r.feedback_rating
        ? {
            rating: r.feedback_rating,
          }
        : undefined,
    }));
  };
