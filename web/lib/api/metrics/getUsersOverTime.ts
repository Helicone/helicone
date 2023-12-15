import { UsersOverTime } from "../../../pages/api/metrics/usersOverTime";
import { Result, resultMap } from "../../result";
import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

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
