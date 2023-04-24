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
};

export function buildFilterLeaf(
  filter: FilterLeaf,
  argsAcc: any[],
  keyMappings: KeyMappings
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
            filters.push(`${columnName} ${sqlOperator} $${argsAcc.length + 1}`);
            if (operatorKey === "contains") {
              argsAcc.push(`%${value}%`);
            } else {
              argsAcc.push(value);
            }
          }
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
  filter: FilterBranch,
  argsAcc: any[],
  having?: boolean
): { filter: string; argsAcc: any[] } {
  if (filter.operator !== "or" && filter.operator !== "and") {
    throw new Error("Invalid filter: only OR is supported");
  }
  const { filter: leftFilter, argsAcc: leftArgsAcc } = buildFilter(
    filter.left,
    argsAcc,
    having
  );
  const { filter: rightFilter, argsAcc: rightArgsAcc } = buildFilter(
    filter.right,
    leftArgsAcc,
    having
  );
  return {
    filter: `(${leftFilter} ${filter.operator} ${rightFilter})`,
    argsAcc: rightArgsAcc,
  };
}

export function buildFilter(
  filter: FilterNode,
  argsAcc: any[],
  having?: boolean
): { filter: string; argsAcc: any[] } {
  if (filter === "all") {
    return {
      filter: "true",
      argsAcc,
    };
  }
  if ("left" in filter) {
    return buildFilterBranch(filter, argsAcc, having);
  }

  const res = buildFilterLeaf(
    filter,
    argsAcc,
    having ? havingKeyMappings : whereKeyMappings
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

async function buildUserIdHashesFilter(user_id: string): Promise<FilterNode> {
  const userIdHashes = await getUserIdHashes(user_id);
  const filters: FilterLeaf[] = userIdHashes.map((hash) => ({
    request: {
      auth_hash: {
        equals: hash,
      },
    },
  }));
  return filterListToTree(filters, "or");
}

async function buildPropertyHashesFilter(user_id: string): Promise<FilterNode> {
  const userIdHashes = await getUserIdHashes(user_id);
  const filters: FilterLeaf[] = userIdHashes.map((hash) => ({
    properties_table: {
      auth_hash: {
        equals: hash,
      },
    },
  }));
  return filterListToTree(filters, "or");
}

export async function buildFilterWithAuthProperties(
  user_id: string,
  filter: FilterNode = "all",
  argsAcc: any[] = [],
  having: boolean = false
): Promise<{ filter: string; argsAcc: any[] }> {
  const userIdHashesFilter = await buildPropertyHashesFilter(user_id);
  const filterNode: FilterNode = {
    left: userIdHashesFilter,
    operator: "and",
    right: filter,
  };
  return buildFilter(filterNode, argsAcc, having);
}

export async function buildFilterWithAuth(
  user_id: string,
  filter: FilterNode,
  argsAcc: any[],
  having?: boolean
): Promise<{ filter: string; argsAcc: any[] }> {
  const userIdHashesFilter = await buildUserIdHashesFilter(user_id);
  const filterNode: FilterNode = {
    left: userIdHashesFilter,
    operator: "and",
    right: filter,
  };
  return buildFilter(filterNode, argsAcc, having);
}
