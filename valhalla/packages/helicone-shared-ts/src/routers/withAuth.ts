import { IRouterWrapperAuth, IRouterWrapperDB } from "./iRouterWrapper";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { withDB } from "./withDB";
import { SupabaseConnector } from "../db/supabase";
import { RequestWrapper } from "../requestWrapper";

class AuthError extends Error {
  constructor(message: string, trace: string) {
    super(`message, trace: ${trace}`);
  }
}

export function withAuth<T>(
  fn: ({ db, request, res, supabaseClient }: IRouterWrapperAuth<T>) => void,
  throwOnAuthError = false
) {
  return withDB<T>(async ({ db, request, res }) => {
    const supabaseClient = new SupabaseConnector();
    const authorization = request.authHeader();

    if (authorization.error) {
      if (throwOnAuthError) {
        throw new AuthError(
          authorization.error,
          "withAuth.authorization.error"
        );
      } else {
        res.status(401).json({
          error: authorization.error,
          trace: "isAuthenticated.error",
        });
      }
      return;
    }

    const authParams = await supabaseClient.authenticate(authorization.data!);

    if (authParams.error) {
      console.error("authParams.error", authParams.error);

      console.error("Authorization header", authorization);
      const SUPABASE_CREDS = JSON.parse(process.env.SUPABASE_CREDS ?? "{}");
      const supabaseURL = SUPABASE_CREDS?.url;
      const pingUrl = `${supabaseURL}`;
      if (throwOnAuthError) {
        throw new AuthError(authParams.error, "withAuth.authParams.error");
      } else {
        res.status(401).json({
          error: authParams.error,
          trace: "authParams.error",
          authorizationString: authorization,
          supabaseURL: supabaseURL,
          pingUrl,
          // pingResponse,
        });
      }
      return;
    }

    fn({
      db,
      request,
      res,
      authParams: authParams.data!,
      supabaseClient: supabaseClient,
    });
  });
}
