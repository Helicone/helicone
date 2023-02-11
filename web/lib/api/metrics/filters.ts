export interface FilterLeaf {
  user_api_keys?: {
    api_key_hash?: {
      equals?: {
        api_key_hash: string[];
      };
    };
  };

  response?: {
    body?: {
      tokens?: {
        gte?: number;
        lte?: number;
      };
      model?: {
        equals?: {
          model: string[];
        };
      };
    };
  };
  request?: {
    created_at?: {
      gte?: string;
      lte?: string;
    };
  };
}
export interface FilterBranch {
  left: FilterNode;
  operator: "or"; // Can add more later
  right: FilterNode;
}

export type FilterNode = FilterLeaf | FilterBranch | "all";

export function buildFilterLeaf(filter: FilterLeaf): string[] {
  let filters: string[] = [];
  if (filter.user_api_keys) {
    if (filter.user_api_keys.api_key_hash?.equals) {
      filters = filters.concat(
        filter.user_api_keys.api_key_hash.equals.api_key_hash.map(
          (hash) =>
            `quote_literal(user_api_keys.api_key_hash) = quote_literal('${hash}')`
        )
      );
    }
  }

  if (filter.response) {
    if (filter.response.body) {
      if (filter.response.body.tokens) {
        if (filter.response.body.tokens.gte) {
          if (isNaN(filter.response.body.tokens.gte)) {
            throw new Error(
              "Invalid filter: filter.response.body.tokens.gte must be a number"
            );
          }

          filters = filters.concat(
            `((response.body -> 'usage') ->> 'total_tokens')::bigint >= ${filter.response.body.tokens.gte}`
          );
        }
        if (filter.response.body.tokens.lte) {
          if (isNaN(filter.response.body.tokens.lte)) {
            throw new Error(
              "Invalid filter: filter.response.body.tokens.lte must be a number"
            );
          }
          filters = filters.concat(
            `((response.body -> 'usage') ->> 'total_tokens')::bigint <= ${filter.response.body.tokens.lte}`
          );
        }
      }
      if (filter.response.body.model) {
        if (filter.response.body.model.equals) {
          filters = filters.concat(
            filter.response.body.model.equals.model.map(
              (model) =>
                `quote_literal(response.body ->> 'model') = quote_literal('${model}')`
            )
          );
        }
      }
    }
  }
  if (filter.request) {
    if (filter.request.created_at) {
      if (filter.request.created_at.gte) {
        if (isNaN(Date.parse(filter.request.created_at.gte))) {
          throw new Error(
            "Invalid filter: filter.request.created_at.gte must be a valid date"
          );
        }
        filters = filters.concat(
          `request.created_at >= '${filter.request.created_at.gte}'`
        );
      }
      if (filter.request.created_at.lte) {
        if (isNaN(Date.parse(filter.request.created_at.lte))) {
          throw new Error(
            "Invalid filter: filter.request.created_at.lte must be a valid date"
          );
        }
        filters = filters.concat(
          `request.created_at <= '${filter.request.created_at.lte}'`
        );
      }
    }
  }
  return filters;
}

export function buildFilterBranch(filter: FilterBranch): string {
  if (filter.operator !== "or") {
    throw new Error("Invalid filter: only OR is supported");
  }

  return `(${buildFilter(filter.left)} ${filter.operator} ${buildFilter(
    filter.right
  )})`;
}

export function buildFilter(filter: FilterNode): string {
  if (filter === "all") {
    return "true";
  }
  if ("left" in filter) {
    return buildFilterBranch(filter);
  }
  return buildFilterLeaf(filter).join(" AND ");
}
