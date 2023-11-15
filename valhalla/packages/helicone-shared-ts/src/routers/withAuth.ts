import { IRouterWrapperAuth, IRouterWrapperDB } from "./iRouterWrapper";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { withDB } from "./withDB";
import { SupabaseConnector } from "../db/supabase";

export function withAuth<T extends ExpressRequest, K extends ExpressResponse>(
  fn: ({ db, req, res, supabaseClient }: IRouterWrapperAuth) => void
) {
  return withDB(async ({ db, req, res }) => {
    const supabaseClient = new SupabaseConnector();
    const authorizationString = req.headers.authorization;
    if ("string" !== typeof authorizationString) {
      res.status(401).json({
        error: "No authorization header",
      });
      return;
    }

    const isAuthenticated = await supabaseClient.authenticate(
      authorizationString,
      req.headers["helicone-org-id"] as string
    );
    if (isAuthenticated.error) {
      res.status(401).json({
        error: isAuthenticated.error,
      });
      return;
    }

    fn({
      db,
      req,
      res,
      supabaseClient: supabaseClient,
    });
  });
}
