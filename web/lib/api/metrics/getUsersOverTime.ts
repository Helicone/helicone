import { UsersOverTime } from "../../../pages/api/metrics/usersOverTime";
import { Result, resultMap } from "../../result";

import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

/**
 * Retrieves the number of users over time based on the provided data.
 * @param data The data for the request.
 * @returns A promise that resolves to a Result object containing an array of UsersOverTime objects or an error message.
 */
export async function getUsersOverTime(
  data: DataOverTimeRequest
): Promise<Result<UsersOverTime[], string>> {
  const res = await getXOverTime<{
    users: number;
  }>(data, "count(DISTINCT response_copy_v3.user_id) AS users");
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      count: Number(d.users),
    }))
  );
}
