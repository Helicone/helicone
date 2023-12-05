import { IRouterWrapperAuth, IRouterWrapperDB } from "./iRouterWrapper";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { withDB } from "./withDB";
import { SupabaseConnector } from "../db/supabase";
import { RequestWrapper } from "../requestWrapper";

export function withAuth<T>(
  fn: ({ db, request, res, supabaseClient }: IRouterWrapperAuth<T>) => void
) {
  return withDB<T>(async ({ db, request, res }) => {
    const supabaseClient = new SupabaseConnector();
    const authorizationString = request.authHeader();
    if ("string" !== typeof authorizationString) {
      res.status(401).json({
        error: "No authorization header",
      });
      return;
    }

    const isAuthenticated = await supabaseClient.authenticate(
      authorizationString,
      request.heliconeOrgId()
    );
    if (isAuthenticated.error) {
      res.status(401).json({
        error: isAuthenticated.error,
      });
      return;
    }

    fn({
      db,
      request,
      res,
      supabaseClient: supabaseClient,
    });
  });
}
