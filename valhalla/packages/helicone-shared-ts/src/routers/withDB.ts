import { createValhallaClient } from "..";
import { RequestWrapper } from "../requestWrapper";
import { IRouterWrapperDB } from "./iRouterWrapper";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
const valhallaDB = createValhallaClient();
export function withDB<T>(
  fn: ({ db, request, res }: IRouterWrapperDB<T>) => void
) {
  return async (req: ExpressRequest, res: ExpressResponse) => {
    fn({
      db: valhallaDB,
      request: new RequestWrapper<T>(req),
      res,
    });
  };
}
