import { ApolloError } from "apollo-server-errors";
import { getRequests } from "../../request/request";
import { getUserOrThrow } from "../helpers/auth";
import {
  HeliconeRequest,
  QueryHeliconeRequestArgs,
} from "../schema/types/graphql";

export async function heliconeRequest(
  root: any,
  args: QueryHeliconeRequestArgs,
  context: any,
  info: any
): Promise<HeliconeRequest[]> {
  const userId = await getUserOrThrow(context.auth);
  const { limit, offset } = {
    limit: (args.limit ?? 100) >= 100 ? 100 : args.limit,
    offset: args.offset ?? 0,
  };
  const { data, error } = await getRequests(userId, "all", 0, 100, {});
  if (error !== null) {
    throw new ApolloError(error, "UNAUTHENTICATED");
  }
  return data.map((r) => ({
    id: r.request_id,
    prompt: r.request_prompt,
    response: r.response_prompt,
  }));
}
