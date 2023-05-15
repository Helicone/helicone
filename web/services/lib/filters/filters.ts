import { supabaseServer } from "../../../lib/supabaseServer";
import {
  AllOperators,
  FilterBranch,
  FilterLeaf,
  filterListToTree,
  FilterNode,
  TablesAndViews,
} from "./filterDefs";

type KeyMappings = {
  [key in keyof TablesAndViews]:
    | {
        [key2 in keyof TablesAndViews[key]]: string;
      }
    | ((x: string) => string);
};

const whereKeyMappings: KeyMappings = {
  user_metrics: {
    user_id: "request.user_id",
  },
  user_api_keys: {
    api_key_hash: "user_api_keys.api_key_hash",
    api_key_name: "user_api_keys.api_key_name",
  },
  properties: (key) => `properties ->> '${key}'`,
  request: {
    // TODO: We need to be able to handle multiple messages
    prompt:
      "(coalesce(request.body ->>'prompt', request.body ->'messages'->0->>'content'))::text",
    created_at: "request.created_at",
    user_id: "request.user_id",
    auth_hash: "request.auth_hash",
    org_id: "request.helicone_org_id",
    id: "request.id",
  },
  response: {
    body_completion:
      "(coalesce(response.body ->'choices'->0->>'text', response.body ->'choices'->0->>'message'))::text",
    body_model: "request.body ->> 'model'",
    body_tokens: "((response.body -> 'usage') ->> 'total_tokens')::bigint",
    status: "response.status",
  },
  values: (key) => `prompt_values ->> '${key}'`,
  properties_table: {
    auth_hash: "properties.auth_hash",
    key: "properties.key",
    value: "properties.value",
  },
  response_copy_v1: {
    auth_hash: "response_copy_v1.auth_hash",
    model: "response_copy_v1.model",
    request_created_at: "response_copy_v1.request_created_at",
    latency: "response_copy_v1.latency",
    user_id: "response_copy_v1.user_id",
    status: "response_copy_v1.status",
  },
  response_copy_v2: {
    auth_hash: "response_copy_v2.auth_hash",
    model: "response_copy_v2.model",
    request_created_at: "response_copy_v2.request_created_at",
    latency: "response_copy_v2.latency",
    user_id: "response_copy_v2.user_id",
    status: "response_copy_v2.status",
    organization_id: "response_copy_v2.organization_id",
  },
  users_view: {},
  properties_copy_v1: {
    key: "properties_copy_v1.key",
    value: "properties_copy_v1.value",
    auth_hash: "properties_copy_v1.auth_hash",
  },
  properties_copy_v2: {
    key: "properties_copy_v2.key",
    value: "properties_copy_v2.value",
    organization_id: "properties_copy_v2.organization_id",
  },
};

const havingKeyMappings: KeyMappings = {
  user_metrics: {
    last_active: "max(request.created_at)",
    total_requests: "count(request.id)",
  },
  user_api_keys: {},
  properties: {},
  request: {},
  response: {},
  values: {},
  properties_table: {},
  response_copy_v1: {},
  properties_copy_v1: {},
  users_view: {
    cost: "cost",
  },
  response_copy_v2: {},
  properties_copy_v2: {},
};

export function buildFilterLeaf(
  filter: FilterLeaf,
  argsAcc: any[],
  keyMappings: KeyMappings,
  argPlaceHolder: (arg_index: number, arg: any) => string
): {
  filters: string[];
  argsAcc: any[];
} {
  const filters: string[] = [];

  for (const tableKey in filter) {
    const table = filter[tableKey as keyof FilterLeaf];

    for (const columnKey in table) {
      const column = table[columnKey as keyof typeof table] as Record<
        AllOperators,
        any
      >;

      for (const operatorKey in column) {
        const value = column[operatorKey as AllOperators];

        const whereKey = keyMappings[tableKey as keyof FilterLeaf];
        if (whereKey !== undefined) {
          const columnName =
            typeof whereKey === "function"
              ? whereKey(columnKey)
              : whereKey[columnKey as keyof typeof whereKey];

          const sqlOperator =
            operatorKey === "equals"
              ? "="
              : operatorKey === "like"
              ? "LIKE"
              : operatorKey === "ilike"
              ? "ILIKE"
              : operatorKey === "gte"
              ? ">="
              : operatorKey === "lte"
              ? "<="
              : operatorKey === "not-equals"
              ? "!="
              : operatorKey === "contains"
              ? "ILIKE"
              : undefined;

          if (sqlOperator && columnName) {
            filters.push(
              `${columnName} ${sqlOperator} ${argPlaceHolder(
                argsAcc.length,
                value
              )}`
            );
            if (operatorKey === "contains") {
              argsAcc.push(`%${value}%`);
            } else {
              argsAcc.push(value);
            }
          } else {
            throw new Error(`Invalid filter: ${tableKey}.${columnKey}`);
          }
        } else {
          throw new Error(`Invalid filter: ${tableKey}.${columnKey}`);
        }
      }
    }
  }

  return {
    filters,
    argsAcc,
  };
}

export function buildFilterBranch(
  args: Omit<BuildFilterArgs, "filter"> & { filter: FilterBranch }
): {
  filter: string;
  argsAcc: any[];
} {
  const { filter, argPlaceHolder, argsAcc, having } = args;
  if (filter.operator !== "or" && filter.operator !== "and") {
    throw new Error("Invalid filter: only OR is supported");
  }
  const { filter: leftFilter, argsAcc: leftArgsAcc } = buildFilter({
    ...args,
    filter: filter.left,
    argsAcc,
    argPlaceHolder,
    having,
  });
  const { filter: rightFilter, argsAcc: rightArgsAcc } = buildFilter({
    ...args,
    filter: filter.right,
    argsAcc: leftArgsAcc,
    argPlaceHolder,
    having,
  });
  return {
    filter: `(${leftFilter} ${filter.operator} ${rightFilter})`,
    argsAcc: rightArgsAcc,
  };
}

export function buildFilter(args: BuildFilterArgs): {
  filter: string;
  argsAcc: any[];
} {
  const { filter, argPlaceHolder, argsAcc, having } = args;
  if (filter === "all") {
    return {
      filter: "true",
      argsAcc,
    };
  }
  if ("left" in filter) {
    return buildFilterBranch({
      ...args,
      filter,
      argsAcc,
      argPlaceHolder,
      having,
    });
  }

  const res = buildFilterLeaf(
    filter,
    argsAcc,
    having ? havingKeyMappings : whereKeyMappings,
    argPlaceHolder
  );

  if (res.filters.length === 0) {
    return {
      filter: "true",
      argsAcc: res.argsAcc,
    };
  }
  return {
    filter: res.filters.join(" AND "),
    argsAcc: res.argsAcc,
  };
}

function clickhouseParam(index: number, parameter: any) {
  if (typeof parameter === "number") {
    return `{val_${index} : Int32}`;
  } else if (typeof parameter === "boolean") {
    return `{val_${index} : UInt8}`;
  } else if (parameter instanceof Date) {
    return `{val_${index} : DateTime}`;
  } else {
    return `{val_${index} : String}`;
  }
}

export function buildFilterClickHouse(
  args: ExternalBuildFilterArgs
): ReturnType<typeof buildFilter> {
  return buildFilter({
    ...args,
    argPlaceHolder: clickhouseParam,
  });
}

function buildFilterPostgres(
  args: ExternalBuildFilterArgs
): ReturnType<typeof buildFilter> {
  return buildFilter({
    ...args,
    argPlaceHolder: (index, parameter) => `$${index + 1}`,
  });
}

async function getUserIdHashes(user_id: string): Promise<string[]> {
  const { data: user_api_keys, error } = await supabaseServer
    .from("user_api_keys")
    .select("api_key_hash")
    .eq("user_id", user_id);
  if (error) {
    throw error;
  }
  if (!user_api_keys || user_api_keys.length === 0) {
    throw new Error("No API keys found for user");
  }
  return user_api_keys.map((x) => x.api_key_hash);
}

async function buildUserIdHashesFilter(
  user_id: string,
  hashToFilter: (hash: string) => FilterLeaf
) {
  const userIdHashes = await getUserIdHashes(user_id);
  const filters: FilterLeaf[] = userIdHashes.map(hashToFilter);
  return filterListToTree(filters, "or");
}

export interface BuildFilterArgs {
  filter: FilterNode;
  argsAcc: any[];
  having?: boolean;
  argPlaceHolder: (arg_index: number, arg: any) => string;
}
export type ExternalBuildFilterArgs = Omit<
  BuildFilterArgs,
  "argPlaceHolder" | "user_id"
>;

export async function buildFilterWithAuthClickHouse(
  args: ExternalBuildFilterArgs & { org_id: string }
): Promise<{ filter: string; argsAcc: any[] }> {
  return buildFilterWithAuth(args, "clickhouse", (orgId) => ({
    response_copy_v2: {
      organization_id: {
        equals: orgId,
      },
    },
  }));
}

export async function buildFilterWithAuthClickHouseProperties(
  args: ExternalBuildFilterArgs & { org_id: string }
): Promise<{ filter: string; argsAcc: any[] }> {
  return buildFilterWithAuth(args, "clickhouse", (orgId) => ({
    properties_copy_v2: {
      organization_id: {
        equals: orgId,
      },
    },
  }));
}

export async function buildFilterWithAuth(
  args: ExternalBuildFilterArgs & {
    org_id: string;
  },
  database: "postgres" | "clickhouse" = "postgres",
  getOrgIdFilter: (orgId: string) => FilterLeaf = (orgId) => ({
    request: {
      org_id: {
        equals: orgId,
      },
    },
  })
): Promise<{ filter: string; argsAcc: any[] }> {
  const { org_id, filter } = args;

  const filterNode: FilterNode = {
    left: getOrgIdFilter(org_id),
    operator: "and",
    right: filter,
  };

  const filterBuilder =
    database === "clickhouse" ? buildFilterClickHouse : buildFilterPostgres;

  return filterBuilder({
    ...args,
    filter: filterNode,
  });
}
