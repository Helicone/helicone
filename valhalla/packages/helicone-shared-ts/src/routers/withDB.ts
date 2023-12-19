import { createValhallaClient } from "..";
import { RequestWrapper } from "../requestWrapper";
import { IRouterWrapperDB } from "./iRouterWrapper";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";

export function withDB<T>(
  fn: ({ db, request, res }: IRouterWrapperDB<T>) => Promise<void>
) {
  return async (req: ExpressRequest, res: ExpressResponse) => {
    const valhallaDB = await createValhallaClient();
    return await fn({
      db: valhallaDB,
      request: new RequestWrapper<T>(req),
      res,
    });
  };
}
