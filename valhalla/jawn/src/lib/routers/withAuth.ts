import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { SupabaseConnector } from "../db/supabase";
import { RequestWrapper } from "../requestWrapper";
import { IRouterWrapperAuth } from "./iRouterWrapper";
import { S3Client } from "../shared/db/s3Client";
const supabaseClient = new SupabaseConnector();

class AuthError extends Error {
  constructor(message: string, trace: string) {
    super(`message, trace: ${trace}`);
  }
}

export function withAuth<T>(
  fn: ({ request, res, supabaseClient }: IRouterWrapperAuth<T>) => Promise<void>
) {
  return async (req: ExpressRequest, res: ExpressResponse) => {
    const request = new RequestWrapper<T>(req);
    const authorization = request.authHeader();

    if (authorization.error) {
      res.status(401).json({
        error: authorization.error,
      });
      return;
    }

    const authParams = await supabaseClient.authenticate(authorization.data!);

    if (authParams.error) {
      console.error("authParams.error", authParams.error);

      console.error("Authorization header", authorization);
      const SUPABASE_CREDS = JSON.parse(process.env.SUPABASE_CREDS ?? "{}");
      const supabaseURL = SUPABASE_CREDS?.url ?? process.env.SUPABASE_URL;
      const pingUrl = `${supabaseURL}`;

      res.status(401).json({
        error: authParams.error,
        trace: "isAuthenticated.error",
        authorizationString: authorization,
        supabaseURL: supabaseURL,
        pingUrl,
        // pingResponse,
      });
      return;
    }

    return await fn({
      request,
      res,
      authParams: authParams.data!,
      supabaseClient: supabaseClient,
      s3Client: new S3Client(
        process.env.S3_ACCESS_KEY,
        process.env.S3_SECRET_KEY,
        process.env.S3_ENDPOINT,
        process.env.S3_BUCKET_NAME
      ),
    });
  };
}
