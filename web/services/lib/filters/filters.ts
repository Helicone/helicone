import { FilterBranch, FilterLeaf, FilterNode } from "./filterDefs";

export function buildFilterHaving(filter: FilterLeaf): string[] {
  let filters: string[] = [];
  if (filter.user_metrics) {
    if (filter.user_metrics.last_active) {
      if (filter.user_metrics.last_active.gte) {
        if (isNaN(Date.parse(filter.user_metrics.last_active.gte))) {
          throw new Error("Invalid date");
        }
        filters = filters.concat(
          `max(request.created_at) >= '${filter.user_metrics.last_active.gte}'`
        );
      }
      if (filter.user_metrics.last_active.lte) {
        if (isNaN(Date.parse(filter.user_metrics.last_active.lte))) {
          throw new Error("Invalid date");
        }
        filters = filters.concat(
          `max(request.created_at) <= '${filter.user_metrics.last_active.lte}'`
        );
      }
    }
    if (filter.user_metrics.total_requests) {
      if (filter.user_metrics.total_requests.gte) {
        if (isNaN(filter.user_metrics.total_requests.gte)) {
          throw new Error("Invalid number");
        }
        filters = filters.concat(
          `count(request.id) >= ${filter.user_metrics.total_requests.gte}`
        );
      }
      if (filter.user_metrics.total_requests.lte) {
        if (isNaN(filter.user_metrics.total_requests.lte)) {
          throw new Error("Invalid number");
        }
        filters = filters.concat(
          `count(request.id) <= ${filter.user_metrics.total_requests.lte}`
        );
      }
    }
  }
  return filters;
}

export function buildFilterLeaf(filter: FilterLeaf): string[] {
  let filters: string[] = [];

  if (filter.properties) {
    for (const [key, value] of Object.entries(filter.properties)) {
      if (value.equals) {
        if (key.includes("'") || value.equals.includes('"')) {
          throw new Error("Invalid property key or value");
        }
        // check that key is only alphanumeric
        if (!/^[a-zA-Z0-9]+$/.test(key)) {
          throw new Error("Invalid property key");
        }
        filters = filters.concat(
          `quote_literal(properties ->>'${key}') = quote_literal('${value.equals}')`
        );
      }
    }
  }
  if (filter.user_metrics) {
    if (filter.user_metrics.user_id?.equals) {
      if (filter.user_metrics.user_id.equals.includes("'")) {
        throw new Error(
          "Invalid filter: filter.user_metrics.user_id.equals cannot contain single quotes"
        );
      }
      filters = filters.concat(
        `quote_literal(request.user_id) = quote_literal('${filter.user_metrics.user_id.equals}')`
      );
    }
  }
  if (filter.user_api_keys) {
    if (filter.user_api_keys.api_key_hash?.equals) {
      if (filter.user_api_keys.api_key_hash.equals.includes("'")) {
        throw new Error(
          "Invalid filter: filter.user_api_keys.api_key_hash.equals cannot contain single quotes"
        );
      }
      filters = filters.concat(
        `quote_literal(user_api_keys.api_key_hash) = quote_literal('${filter.user_api_keys.api_key_hash.equals}')`
      );
    }
  }

  if (filter.response) {
    if (filter.response.body_tokens) {
      if (filter.response.body_tokens.gte) {
        if (isNaN(filter.response.body_tokens.gte)) {
          throw new Error(
            "Invalid filter: filter.response.body.tokens.gte must be a number"
          );
        }

        filters = filters.concat(
          `((response.body -> 'usage') ->> 'total_tokens')::bigint >= ${filter.response.body_tokens.gte}`
        );
      }
      if (filter.response.body_tokens.lte) {
        if (isNaN(filter.response.body_tokens.lte)) {
          throw new Error(
            "Invalid filter: filter.response.body.tokens.lte must be a number"
          );
        }
        filters = filters.concat(
          `((response.body -> 'usage') ->> 'total_tokens')::bigint <= ${filter.response.body_tokens.lte}`
        );
      }
    }
    if (filter.response.body_model) {
      if (filter.response.body_model.equals) {
        if (filter.response.body_model.equals.includes("'")) {
          throw new Error(
            "Invalid filter: filter.response.body.model.equals cannot contain single quotes"
          );
        }
        filters = filters.concat(
          `quote_literal(response.body ->> 'model') = quote_literal('${filter.response.body_model.equals}')`
        );
      }
    }
  }
  if (filter.request) {
    if (filter.request.prompt) {
      if (filter.request.prompt.equals) {
        // check that prompt is only alphanumeric
        if (!/^[a-zA-Z0-9]+$/.test(filter.request.prompt.equals)) {
          throw new Error("Invalid prompt");
        }
        filters = filters.concat(
          `quote_literal(request.body->>'prompt') = quote_literal('${filter.request.prompt.equals}')`
        );
      }
      if (filter.request.prompt.like) {
        // check that prompt is only alphanumeric
        if (!/^[a-zA-Z0-9]+$/.test(filter.request.prompt.like)) {
          throw new Error("Invalid prompt");
        }
        filters = filters.concat(
          `quote_literal(request.body->>'prompt') LIKE quote_literal('%${filter.request.prompt.like}%')`
        );
      }
      if (filter.request.prompt.ilike) {
        // check that prompt is only alphanumeric
        if (!/^[a-zA-Z0-9]+$/.test(filter.request.prompt.ilike)) {
          throw new Error("Invalid prompt");
        }
        filters = filters.concat(
          `quote_literal(request.body->>'prompt') ILIKE quote_literal('%${filter.request.prompt.ilike}%')`
        );
      }
    }

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

export function buildFilterBranch(
  filter: FilterBranch,
  having?: boolean
): string {
  if (filter.operator !== "or" && filter.operator !== "and") {
    throw new Error("Invalid filter: only OR is supported");
  }

  return `(${buildFilter(filter.left, having)} ${filter.operator} ${buildFilter(
    filter.right,
    having
  )})`;
}

export function buildFilter(filter: FilterNode, having?: boolean): string {
  if (filter === "all") {
    return "true";
  }
  if ("left" in filter) {
    return buildFilterBranch(filter, having);
  }

  const branch = having
    ? buildFilterHaving(filter).join(" AND ")
    : buildFilterLeaf(filter).join(" AND ");
  if (!branch) {
    return "true";
  }
  return branch;
}
