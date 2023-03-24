import { FilterBranch, FilterLeaf, FilterNode } from "./filterDefs";

export function buildFilterHaving(
  filter: FilterLeaf,
  argsAcc: string[]
): {
  filters: string[];
  argsAcc: string[];
} {
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
  return { filters, argsAcc };
}

export function buildFilterLeaf(
  filter: FilterLeaf,
  argsAcc: any[]
): {
  filters: string[];
  argsAcc: any[];
} {
  let filters: string[] = [];

  if (filter.properties) {
    for (const [key, value] of Object.entries(filter.properties)) {
      if (value.equals) {
        argsAcc.push(key);
        argsAcc.push(value.equals);
        const keyIndex = argsAcc.indexOf(key) + 1;
        const valueIndex = argsAcc.indexOf(value.equals) + 1;
        filters.push(`properties ->>$${keyIndex} = $${valueIndex}`);
      } else if (value.ilike) {
        argsAcc.push(key);
        argsAcc.push(value.ilike);
        const keyIndex = argsAcc.indexOf(key) + 1;
        const valueIndex = argsAcc.indexOf(value.ilike) + 1;
        filters.push(`properties ->>$${keyIndex} ILIKE $${valueIndex}`);
      } else if (value.like) {
        argsAcc.push(key);
        argsAcc.push(value.like);
        const keyIndex = argsAcc.indexOf(key) + 1;
        const valueIndex = argsAcc.indexOf(value.like) + 1;
        filters.push(`properties ->>$${keyIndex} LIKE $${valueIndex}`);
      }
    }
  }
  if (filter.values) {
    for (const [key, value] of Object.entries(filter.values)) {
      if (value.equals) {
        argsAcc.push(key);
        argsAcc.push(value.equals);
        const keyIndex = argsAcc.indexOf(key) + 1;
        const valueIndex = argsAcc.indexOf(value.equals) + 1;
        filters.push(`prompt_values ->>$${keyIndex} = $${valueIndex}`);
      } else if (value.ilike) {
        argsAcc.push(key);
        argsAcc.push(value.ilike);
        const keyIndex = argsAcc.indexOf(key) + 1;
        const valueIndex = argsAcc.indexOf(value.ilike) + 1;
        filters.push(`prompt_values ->>$${keyIndex} ILIKE $${valueIndex}`);
      } else if (value.like) {
        argsAcc.push(key);
        argsAcc.push(value.like);
        const keyIndex = argsAcc.indexOf(key) + 1;
        const valueIndex = argsAcc.indexOf(value.like) + 1;
        filters.push(`prompt_values ->>$${keyIndex} LIKE $${valueIndex}`);
      }
    }
  }

  if (filter.user_metrics) {
    if (filter.user_metrics.user_id?.equals) {
      argsAcc.push(filter.user_metrics.user_id.equals);
      const valueIndex =
        argsAcc.indexOf(filter.user_metrics.user_id.equals) + 1;

      filters.push(`request.user_id = $${valueIndex}`);
    }
  }
  if (filter.user_api_keys) {
    if (filter.user_api_keys.api_key_hash?.equals) {
      argsAcc.push(filter.user_api_keys.api_key_hash.equals);
      const valueIndex =
        argsAcc.indexOf(filter.user_api_keys.api_key_hash.equals) + 1;
      filters.push(`user_api_keys.api_key_hash = $${valueIndex}`);
    }
  }

  if (filter.response) {
    if (filter.response.body_tokens) {
      if (filter.response.body_tokens.gte) {
        argsAcc.push(filter.response.body_tokens.gte);
        const valueIndex = argsAcc.indexOf(filter.response.body_tokens.gte) + 1;
        filters.push(
          `((response.body -> 'usage') ->> 'total_tokens')::bigint >= $${valueIndex}`
        );
      }
      if (filter.response.body_tokens.lte) {
        argsAcc.push(filter.response.body_tokens.lte);
        const valueIndex = argsAcc.indexOf(filter.response.body_tokens.lte) + 1;
        filters.push(
          `((response.body -> 'usage') ->> 'total_tokens')::bigint <= $${valueIndex}`
        );
      }
    }
    if (filter.response.body_model) {
      if (filter.response.body_model.equals) {
        argsAcc.push(filter.response.body_model.equals);
        const valueIndex =
          argsAcc.indexOf(filter.response.body_model.equals) + 1;
        filters.push(`response.body ->> 'model' = $${valueIndex}`);
      }
    }

    if (filter.response.body_completion) {
      if (filter.response.body_completion.equals) {
        argsAcc.push(filter.response.body_completion.equals);
        const valueIndex =
          argsAcc.indexOf(filter.response.body_completion.equals) + 1;
        filters.push(
          `(coalesce(request.body ->>'prompt', request.body ->'messages'->0->>'content'))::text = $${valueIndex}`
        );
      }
      if (filter.response.body_completion.like) {
        argsAcc.push(filter.response.body_completion.like);
        const valueIndex =
          argsAcc.indexOf(filter.response.body_completion.like) + 1;
        filters.push(
          `(coalesce(request.body ->>'prompt', request.body ->'messages'->0->>'content'))::text LIKE $${valueIndex}`
        );
      }
      if (filter.response.body_completion.ilike) {
        argsAcc.push(filter.response.body_completion.ilike);
        const valueIndex =
          argsAcc.indexOf(filter.response.body_completion.ilike) + 1;
        filters.push(
          `(coalesce(request.body ->>'prompt', request.body ->'messages'->0->>'content'))::text ILIKE $${valueIndex}`
        );
      }
    }
  }
  if (filter.request) {
    if (filter.request.user_id) {
      if (filter.request.user_id.equals) {
        argsAcc.push(filter.request.user_id.equals);
        const valueIndex = argsAcc.indexOf(filter.request.user_id.equals) + 1;
        filters.push(`request.user_id = $${valueIndex}`);
      }
    }
    if (filter.request.prompt) {
      if (filter.request.prompt.equals) {
        argsAcc.push(filter.request.prompt.equals);
        const valueIndex = argsAcc.indexOf(filter.request.prompt.equals) + 1;
        filters.push(`request.body ->> 'prompt' = $${valueIndex}`);
      }
      if (filter.request.prompt.like) {
        argsAcc.push(filter.request.prompt.like);
        const valueIndex = argsAcc.indexOf(filter.request.prompt.like) + 1;
        filters.push(`request.body ->> 'prompt' LIKE $${valueIndex}`);
      }
      if (filter.request.prompt.ilike) {
        argsAcc.push(filter.request.prompt.ilike);
        const valueIndex = argsAcc.indexOf(filter.request.prompt.ilike) + 1;
        filters.push(`request.body ->> 'prompt' ILIKE $${valueIndex}`);
      }
    }

    if (filter.request.created_at) {
      if (filter.request.created_at.gte) {
        argsAcc.push(filter.request.created_at.gte);
        const valueIndex = argsAcc.indexOf(filter.request.created_at.gte) + 1;
        filters.push(`request.created_at >= $${valueIndex}`);
      }
      if (filter.request.created_at.lte) {
        argsAcc.push(filter.request.created_at.lte);
        const valueIndex = argsAcc.indexOf(filter.request.created_at.lte) + 1;
        filters.push(`request.created_at <= $${valueIndex}`);
      }
    }
  }
  return { filters, argsAcc };
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

  const res = having
    ? buildFilterHaving(filter, argsAcc)
    : buildFilterLeaf(filter, argsAcc);
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
