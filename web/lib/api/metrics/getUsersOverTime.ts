import { Result, resultMap } from "../../result";
import { getXOverTime } from "./getXOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export async function getUsersOverTime(
  data: DataOverTimeRequest
): Promise<Result<UsersOverTime[], string>> {
  const res = await getXOverTime<{
    users: number;
  }>(data, "count(DISTINCT request_response_rmt.user_id) AS users");
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      count: Number(d.users),
    }))
  );
}
export interface UsersOverTime {
  count: number;
  time: Date;
}
