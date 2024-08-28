export type SortDirection = "asc" | "desc";

const isValidSortDirection = (sort: SortDirection) => {
  return sort === "asc" || sort === "desc";
};

export interface SortLeafRequest {
  random?: true;
  created_at?: SortDirection;
  cache_created_at?: SortDirection;
  latency?: SortDirection;
  last_active?: SortDirection;
  total_tokens?: SortDirection;
  completion_tokens?: SortDirection;
  prompt_tokens?: SortDirection;
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
  if (sort.random) {
    return "random()";
  }
  if (sort.cache_created_at) {
    assertValidSortDirection(sort.cache_created_at);
    return `cache_hits.created_at ${sort.cache_created_at}`;
  }
  if (sort.created_at) {
    assertValidSortDirection(sort.created_at);
    return `request.created_at ${sort.created_at}`;
  }
  if (sort.latency) {
    assertValidSortDirection(sort.latency);
    return `response.delay_ms ${sort.latency}`;
  }
  if (sort.total_tokens) {
    assertValidSortDirection(sort.total_tokens);
    return `(response.prompt_tokens + response.completion_tokens) ${sort.total_tokens}`;
  }

  if (sort.completion_tokens) {
    assertValidSortDirection(sort.completion_tokens);
    return `response.completion_tokens ${sort.completion_tokens}`;
  }

  if (sort.prompt_tokens) {
    assertValidSortDirection(sort.prompt_tokens);
    return `response.prompt_tokens ${sort.prompt_tokens}`;
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

export function buildRequestSortClickhouse(sort: SortLeafRequest): string {
  if (sort.random) {
    return "rand()";
  }
  if (sort.created_at) {
    assertValidSortDirection(sort.created_at);
    return `request_response_rmt.request_created_at ${sort.created_at}`;
  }
  if (sort.latency) {
    assertValidSortDirection(sort.latency);
    return `request_response_rmt.latency ${sort.latency}`;
  }
  if (sort.total_tokens) {
    assertValidSortDirection(sort.total_tokens);
    return `(request_response_rmt.prompt_tokens + request_response_rmt.completion_tokens) ${sort.total_tokens}`;
  }
  if (sort.completion_tokens) {
    assertValidSortDirection(sort.completion_tokens);
    return `request_response_rmt.completion_tokens ${sort.completion_tokens}`;
  }
  if (sort.prompt_tokens) {
    assertValidSortDirection(sort.prompt_tokens);
    return `request_response_rmt.prompt_tokens ${sort.prompt_tokens}`;
  }
  if (sort.user_id) {
    assertValidSortDirection(sort.user_id);
    return `request_response_rmt.user_id ${sort.user_id}`;
  }
  if (sort.body_model) {
    assertValidSortDirection(sort.body_model);
    return `request_response_rmt.model ${sort.body_model}`;
  }
  if (sort.is_cached) {
    assertValidSortDirection(sort.is_cached);
    return `request_response_rmt.is_cached ${sort.is_cached}`;
  }
  if (sort.request_prompt) {
    assertValidSortDirection(sort.request_prompt);
    return `JSONExtractString(request_response_rmt.request_body, 'prompt') ${sort.request_prompt}`;
  }
  if (sort.response_text) {
    assertValidSortDirection(sort.response_text);
    return `JSONExtractString(request_response_rmt.response_body, 'choices', 0, 'text') ${sort.response_text}`;
  }
  if (sort.properties) {
    for (const key in sort.properties) {
      assertValidSortDirection(sort.properties[key]);
      if (!key.match(/^[a-zA-Z0-9_]+$/)) {
        throw new Error(`Invalid property key: ${key}`);
      }
      return `request_response_rmt.properties['${key}'] ${sort.properties[key]}`;
    }
  }

  // Default sort if no valid sort option is provided
  return `request_response_rmt.request_created_at DESC`;
}

export interface SortLeafJob {
  created_at?: SortDirection;
  updated_at?: SortDirection;
  timeout_seconds?: SortDirection;
  name?: SortDirection;
  description?: SortDirection;
  status?: SortDirection;
  org_id?: SortDirection;
  job_id?: SortDirection;
  node_id?: SortDirection;
  custom_properties?: {
    [key: string]: SortDirection;
  };
}

export function buildJobSort(sort: SortLeafJob): string {
  if (sort.created_at) {
    assertValidSortDirection(sort.created_at);
    return `job.created_at ${sort.created_at}`;
  }
  if (sort.updated_at) {
    assertValidSortDirection(sort.updated_at);
    return `job.updated_at ${sort.updated_at}`;
  }
  if (sort.timeout_seconds) {
    assertValidSortDirection(sort.timeout_seconds);
    return `job.timeout_seconds ${sort.timeout_seconds}`;
  }
  if (sort.name) {
    assertValidSortDirection(sort.name);
    return `job.name ${sort.name}`;
  }
  if (sort.description) {
    assertValidSortDirection(sort.description);
    return `job.description ${sort.description}`;
  }
  if (sort.status) {
    assertValidSortDirection(sort.status);
    return `job.status ${sort.status}`;
  }
  if (sort.org_id) {
    assertValidSortDirection(sort.org_id);
    return `job.organization_id ${sort.org_id}`;
  }
  if (sort.job_id) {
    assertValidSortDirection(sort.job_id);
    return `job.job_id ${sort.job_id}`;
  }
  if (sort.node_id) {
    assertValidSortDirection(sort.node_id);
    return `job.node_id ${sort.node_id}`;
  }

  if (sort.custom_properties) {
    for (const key in sort.custom_properties) {
      assertValidSortDirection(sort.custom_properties[key]);
      // ensure key is alphanumeric
      if (!key.match(/^[a-zA-Z0-9_]+$/)) {
        throw new Error(`Invalid property key: ${key}`);
      }
      return `(job.custom_properties ->> '${key}')::text ${sort.custom_properties[key]}`;
    }
  }

  // Return a default value if none of the conditions are met
  return "";
}
