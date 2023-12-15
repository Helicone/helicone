import { UserMetric } from "../../../../lib/api/users/users";

export type SortDirection = "asc" | "desc";

const isValidSortDirection = (sort: SortDirection) => {
  return sort === "asc" || sort === "desc";
};

function assertValidSortDirection(direction: SortDirection) {
  if (!isValidSortDirection(direction)) {
    throw new Error(`Invalid sort direction: ${direction}`);
  }
}

export type SortLeafUsers = {
  [K in keyof UserMetric]?: SortDirection;
};

const sortMappings: { [K in keyof UserMetric]: string } = {
  user_id: "request.user_id",
  active_for: "active_for",
  last_active: "last_active",
  total_requests: "total_requests",
  average_requests_per_day_active: "average_requests_per_day_active",
  average_tokens_per_request: "average_tokens_per_request",
  first_active: "first_active",
  cost: "cost",
};

export function buildUserSort(
  sort: SortLeafUsers,
  argsAcc: any[] = []
): {
  orderByString: string;
  argsAcc: any[];
} {
  const sortKeys = Object.keys(sort);
  if (sortKeys.length === 0) {
    argsAcc = argsAcc.concat([sortMappings.last_active]);
    return {
      orderByString: `{val_${argsAcc.length - 1}: String} DESC`,
      argsAcc,
    };
  } else {
    const sortKey = sortKeys[0];
    const sortDirection = sort[sortKey as keyof UserMetric];
    assertValidSortDirection(sortDirection!);
    const sortColumn = sortMappings[sortKey as keyof UserMetric];
    argsAcc = argsAcc.concat([sortColumn]);
    return {
      orderByString: `{val_${argsAcc.length - 1}: Identifier} ${sortDirection}`,
      argsAcc,
    };
  }
}
