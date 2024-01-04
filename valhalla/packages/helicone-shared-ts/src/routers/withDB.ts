import { createValhallaClient } from "..";
import { RequestWrapper } from "../requestWrapper";
import { IRouterWrapperDB } from "./iRouterWrapper";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";

export function withDB<T>(
  fn: ({ db, request, res }: IRouterWrapperDB<T>) => void
) {
  return async (req: ExpressRequest, res: ExpressResponse) => {
    res.json({
      message: "Response received!  - No implemented:)",
    });
    // const valhallaDB = await createValhallaClient();
    // fn({
    //   db: valhallaDB,
    //   request: new RequestWrapper<T>(req),
    //   res,
    // });
  };
}
