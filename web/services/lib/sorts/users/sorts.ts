export type SortDirection = "asc" | "desc";

const isValidSortDirection = (sort: SortDirection) => {
  return sort === "asc" || sort === "desc";
};

function assertValidSortDirection(direction: SortDirection) {
  if (!isValidSortDirection(direction)) {
    throw new Error(`Invalid sort direction: ${direction}`);
  }
}

export interface SortLeafUsers {
  user_id?: SortDirection;
  active_for?: SortDirection;
  last_active?: SortDirection;
  total_requests?: SortDirection;
  average_requests_per_day_active?: SortDirection;
  average_tokens_per_request?: SortDirection;
}

export function buildUserSort(sort: SortLeafUsers) {
  if (sort.user_id) {
    assertValidSortDirection(sort.user_id);
    return `request.user_id ${sort.user_id}`;
  }
  if (sort.active_for) {
    assertValidSortDirection(sort.active_for);
    return `active_for ${sort.active_for}`;
  }
  if (sort.last_active) {
    assertValidSortDirection(sort.last_active);
    return `last_active ${sort.last_active}`;
  }
  if (sort.total_requests) {
    assertValidSortDirection(sort.total_requests);
    return `total_requests ${sort.total_requests}`;
  }
  if (sort.average_requests_per_day_active) {
    assertValidSortDirection(sort.average_requests_per_day_active);
    return `average_requests_per_day_active ${sort.average_requests_per_day_active}`;
  }
  if (sort.average_tokens_per_request) {
    assertValidSortDirection(sort.average_tokens_per_request);
    return `average_tokens_per_request ${sort.average_tokens_per_request}`;
  }
}
