import { ApolloError } from "apollo-server-core";
import { buildFilterWithAuthClickHouse } from "../../../../services/lib/filters/filters";
import { dbQueryClickhouse } from "../../db/dbExecute";
import { QueryUserArgs, User } from "../schema/types/graphql";
import { FilterNode } from "../../../../services/lib/filters/filterDefs";
import { resultMap } from "../../../result";

export async function getUsers(
  orgId: string,
  filter: FilterNode,
  offset: number,
  limit: number
) {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }
  const builtFilter = await buildFilterWithAuthClickHouse({
    org_id: orgId,
    filter: filter,
    argsAcc: [],
  });
  const query = `
  select 
  response_copy_v3.user_id as user_id,
  count(*) as total_requests,
  sum(response_copy_v3.completion_tokens) as total_completion_tokens,
  sum(response_copy_v3.prompt_tokens) as total_prompt_tokens
  from response_copy_v3 
  where (
    ${builtFilter.filter}
  )
  group by response_copy_v3.user_id
  ORDER BY response_copy_v3.user_id
  limit ${limit}
  offset ${offset}  
`;

  const res = await dbQueryClickhouse<{
    user_id: string;
    total_requests: number;
    total_completion_tokens: number;
    total_prompt_tokens: number;
  }>(query, builtFilter.argsAcc);

  return resultMap(res, (d) => {
    return d.map((r) => ({
      user_id: r.user_id,
      total_requests: +r.total_requests,
      total_completion_tokens: +r.total_completion_tokens,
      total_prompt_tokens: +r.total_prompt_tokens,
    }));
  });
}

export async function queryUser(
  root: any,
  args: QueryUserArgs,
  context: any,
  info: any
): Promise<User[]> {
  const orgId = await context.getOrgIdOrThrow();
  const { limit, offset, user_id } = {
    limit: args.limit ?? 100,
    offset: args.offset ?? 0,
    user_id: args.id ?? null,
  };

  let filter: FilterNode = "all";
  if (user_id !== null) {
    filter = {
      response_copy_v3: {
        user_id: {
          equals: user_id,
        },
      },
    };
  }
  const { data, error } = await getUsers(orgId, filter, offset, limit);
  if (error !== null) {
    throw new ApolloError(error, "INTERNAL_SERVER_ERROR");
  }

  return data.map((r) => ({
    id: r.user_id ?? "HELICONE_USER_ID_NOT_FOUND",
    total_tokens: r.total_completion_tokens + r.total_prompt_tokens,
    total_completion_tokens: r.total_completion_tokens,
    total_prompt_tokens: r.total_prompt_tokens,
    total_requests: r.total_requests,
  }));
}
