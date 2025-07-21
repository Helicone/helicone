import { auth } from "@/lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { SSRContext } from "../../auth/client/getSSRHeliconeAuthClient";
import { HeliconeAuthClient } from "../../auth/client/HeliconeAuthClient";
import { heliconeAuthClientFromSession } from "../client/betterAuthHelper";
import { ORG_ID_COOKIE_KEY } from "@/lib/constants";
import { dbExecute } from "@/lib/api/db/dbExecute";
import { HeliconeOrg, HeliconeUserResult, Role } from "../../auth/types";
import { Database } from "@/db/database.types";
import { err, ok } from "../../result";

export type GenericHeaders = Record<string, string | string[] | undefined>;
async function getUser(betterAuthUserId: string): Promise<HeliconeUserResult> {
  const user = await dbExecute<{
    user_id: string;
    email: string;
  }>(
    `SELECT 
      public.user.auth_user_id as user_id, 
      public.user.email
    FROM public.user
    LEFT JOIN auth.users on public.user.auth_user_id = auth.users.id
    WHERE public.user.id = $1`,
    [betterAuthUserId]
  );
  if (!user || !user.data?.[0]) {
    return err("User not found");
  }

  return ok({
    id: user.data?.[0]?.user_id,
    email: user.data?.[0]?.email,
  });
}
export async function betterAuthClientFromSSRContext(
  ctx: SSRContext<any, any, any>
): Promise<HeliconeAuthClient> {
  if (!ctx.req?.headers) {
    throw new Error("No headers provided");
  }

  const session = await auth.api.getSession({
    headers: fromNodeHeaders(ctx.req?.headers),
  });
  if (!session) {
    throw new Error("Invalid session");
  }

  const user = await getUser(session.user.id);
  if (user.error) {
    throw new Error(user.error);
  }
  const userId = user.data?.id;

  const orgId = ctx.req?.cookies?.[ORG_ID_COOKIE_KEY] ?? "";
  if (!orgId) {
    throw new Error("No organization ID found");
  }

  const org = await dbExecute<
    Database["public"]["Tables"]["organization"]["Row"] & {
      role: Role;
    }
  >(
    `SELECT organization.*, organization_member.org_role as role FROM organization 
  left join organization_member on organization_member.organization = organization.id
  where 
  organization.id = $1
  and organization_member.member = $2
  limit 1
    `,
    [orgId, userId]
  );

  if (org?.error) {
    throw new Error(org.error);
  }

  return heliconeAuthClientFromSession(
    session,
    () => {},
    org?.data?.[0]
      ? {
          org: org.data[0]! as HeliconeOrg,
          role: org.data[0].role ?? "member",
        }
      : undefined,
    user.data ?? undefined
  );
}
