// src/users/usersService.ts
import { RequestQueryParams } from "../../controllers/requestController";
import { Result } from "../../lib/modules/result";
import {
  HeliconeRequest,
  getRequests,
  getRequestsCached,
} from "../../lib/stores/request/request";
import { User } from "../../models/user";
import { BaseManager } from "../BaseManager";

// A post request should not contain an id.
export type UserCreationParams = Pick<User, "email" | "name" | "phoneNumbers">;

export class RequestManager extends BaseManager {
  async getRequests(
    params: RequestQueryParams
  ): Promise<Result<HeliconeRequest[], string>> {
    const {
      filter,
      offset = 0,
      limit = 10,
      sort = {
        created_at: "desc",
      },
      isCached,
    } = params;

    return isCached
      ? await getRequestsCached(
          this.authParams.organizationId,
          filter,
          offset,
          limit,
          sort
        )
      : await getRequests(
          this.authParams.organizationId,
          filter,
          offset,
          limit,
          sort
        );
  }
}
