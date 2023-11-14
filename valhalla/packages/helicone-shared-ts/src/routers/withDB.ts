import { createValhallaClient } from "..";
import { IRouterWrapperDB } from "./iRouterWrapper";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";

export function withDB<T extends ExpressRequest, K extends ExpressResponse>(
  fn: ({ db, req, res }: IRouterWrapperDB) => void
) {
  return async (req: T, res: K) => {
    const valhallaDB = createValhallaClient();
    fn({
      db: valhallaDB,
      req,
      res,
    });
  };
}
