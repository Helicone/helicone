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

function convertTextOperators(op: GQLTextOperators): SingleKey<TextOperators> {
  if (op.not_equals) {
    return { "not-equals": op.not_equals };
  } else {
    return { ...op } as SingleKey<TextOperators>;
  }
}

function convertTimeOperators(
  op: DateOperators
): SingleKey<TimestampOperators> {
  if (op.gte) {
    return { gte: op.gte };
  } else if (op.lte) {
    return { lte: op.lte };
  }
  throw new Error("Invalid date operator");
}

const filterInputToFilterLeaf: {
  [key in keyof HeliconeRequestFilter]: (
    filter: HeliconeRequestFilter[key]
  ) => FilterLeaf | undefined;
} = {
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

export async function heliconeRequest(
  root: any,
  args: QueryHeliconeRequestArgs,
  context: Context,
  info: any
): Promise<HeliconeRequest[]> {
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
  }));
}
