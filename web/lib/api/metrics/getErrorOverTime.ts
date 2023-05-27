import { SupabaseClient, User } from "@supabase/supabase-js";

import { Result } from "../../result";
import {
  DateCountDBModel,
  getTotalRequestsOverTime,
} from "./getRequestOverTime";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

export interface AuthClient {
  client: SupabaseClient;
  user: User;
}

export type ErrorCountOverTime = DateCountDBModel;

export async function getErrorOverTime(
  props: DataOverTimeRequest
): Promise<Result<ErrorCountOverTime[], string>> {
  return getTotalRequestsOverTime({
    ...props,
    userFilter: {
      left: {
        response_copy_v2: {
          status: {
            "not-equals": 200,
          },
        },
      },
      right: props.userFilter,
      operator: "and",
    },
  });
}
