import {
  AllOperators,
  FilterBranch,
  FilterLeaf,
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
    last_active: "max(request.created_at)",
    total_requests: "count(request.id)",
  },
  user_api_keys: {
    api_key_hash: "user_api_keys.api_key_hash",
    api_key_name: "user_api_keys.api_key_name",
  },
  properties: (key) => `properties ->> '${key}'`,
  request: {
    prompt: "request.body ->> 'prompt'",
    created_at: "request.created_at",
    user_id: "request.user_id",
  },
  response: {
    body_completion:
      "(coalesce(request.body ->>'prompt', request.body ->'messages'->0->>'content'))::text",
    body_model: "request.body ->> 'model'",
    body_tokens: "((response.body -> 'usage') ->> 'total_tokens')::bigint",
  },
  values: (key) => `prompt_values ->> '${key}'`,
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
              : undefined;

          if (sqlOperator) {
            filters.push(`${columnName} ${sqlOperator} $${argsAcc.length + 1}`);
            argsAcc.push(value);
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
