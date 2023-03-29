import { getUserOrThrow } from "../helpers/auth";
import { User } from "../schema/types/graphql";

export async function queryUser(
  root: any,
  args: {},
  context: any,
  info: any
): Promise<User> {
  const userId = getUserOrThrow(context.auth);

  return {
    id: "Helllo",
  };
}
