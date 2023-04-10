export type SortDirection = "asc" | "desc";

const isValidSortDirection = (sort: SortDirection) => {
  return sort === "asc" || sort === "desc";
};

export interface SortLeafRequest {
  created_at?: SortDirection;
  latency?: SortDirection;
  last_active?: SortDirection;
  total_tokens?: SortDirection;
  user_id?: SortDirection;
  body_model?: SortDirection;
  is_cached?: SortDirection;
  request_prompt?: SortDirection;
  response_text?: SortDirection;
  properties?: {
    [key: string]: SortDirection;
  };
  values?: {
    [key: string]: SortDirection;
  };
}

function assertValidSortDirection(direction: SortDirection) {
  if (!isValidSortDirection(direction)) {
    throw new Error(`Invalid sort direction: ${direction}`);
  }
}

export function buildRequestSort(sort: SortLeafRequest) {
  if (sort.created_at) {
    assertValidSortDirection(sort.created_at);
    return `request.created_at ${sort.created_at}`;
  }
  if (sort.latency) {
    assertValidSortDirection(sort.latency);
    return `response.created_at - request.created_at ${sort.latency}`;
  }
  if (sort.total_tokens) {
    assertValidSortDirection(sort.total_tokens);
    return `(coalesce((response.body ->'usage'->>'total_tokens')::int, 0))::int ${sort.total_tokens}`;
  }
  if (sort.user_id) {
    assertValidSortDirection(sort.user_id);
    return `request.user_id ${sort.user_id}`;
  }
  if (sort.body_model) {
    assertValidSortDirection(sort.body_model);
    return `response.body -> 'model' ${sort.body_model}`;
  }
  if (sort.is_cached) {
    assertValidSortDirection(sort.is_cached);
    return `cache_count ${sort.is_cached}`;
  }
  if (sort.request_prompt) {
    assertValidSortDirection(sort.request_prompt);
    return `coalesce(request.body ->>'prompt', request.body ->'messages'->0->>'content') ${sort.request_prompt}`;
  }
  if (sort.response_text) {
    assertValidSortDirection(sort.response_text);
    return `coalesce(response.body -> 'choices'->0->'text', response.body -> 'choices'->'message'->'content') ${sort.response_text}`;
  }

  if (sort.properties) {
    for (const key in sort.properties) {
      assertValidSortDirection(sort.properties[key]);
      // ensure key is alphanumeric
      if (!key.match(/^[a-zA-Z0-9_]+$/)) {
        throw new Error(`Invalid property key: ${key}`);
      }
      return `(request.properties ->> '${key}')::text ${sort.properties[key]}`;
    }
  }
  if (sort.values) {
    for (const key in sort.values) {
      assertValidSortDirection(sort.values[key]);
      // ensure key is alphanumeric
      if (!key.match(/^[a-zA-Z0-9_]+$/)) {
        throw new Error(`Invalid value key: ${key}`);
      }
      return `(request.prompt_values ->> '${key}')::text ${sort.values[key]}`;
    }
  }
}
