import {
  SupabaseClient,
  User,
  createPagesServerClient,
} from "@supabase/auth-helpers-nextjs";
import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import { Database } from "../../supabase/database.types";
import { ORG_ID_COOKIE_KEY } from "../constants";
import { Result } from "../result";
import {
  getSupabaseServer,
  supabaseUrl as serverSupabaseUrl,
} from "../supabaseServer";
import { dbExecute } from "../api/db/dbExecute";

export type SSRContext<T> =
  | { req: NextApiRequest; res: NextApiResponse<T> }
  | GetServerSidePropsContext;

interface SupabaseServerWrapperOptions {
  supabaseUrl?: string;
}
export class SupabaseServerWrapper<T> {
  client: SupabaseClient<Database>;
  ctx: SSRContext<T>;
  constructor(ctx: SSRContext<T>, options?: SupabaseServerWrapperOptions) {
    const supabaseUrl = options?.supabaseUrl ?? serverSupabaseUrl ?? "";
    this.ctx = ctx;
    this.client = createPagesServerClient<Database>(ctx, {
      supabaseUrl,
    });
  }

  getClient() {
    return this.client;
  }

  async getUser() {
    await this.client.auth.refreshSession();
    return this.client.auth.getUser();
  }

  async getUserAndOrg(): Promise<
    Result<
      {
        userId: string;
        orgId: string;
        user: User;
        role: string;
      },
      string
    >
  > {
    const user = await this.client.auth.getUser();
    if (!user.data || !user.data.user) {
      return { error: "Unauthorized User", data: null };
    }

    const orgAccessCheck = await dbExecute<{
      organization: string;
      org_role: string;
    }>(
      `SELECT 
      organization_member.organization,
      organization_member.org_role
      FROM organization left join organization_member on organization.id = organization_member.organization
      WHERE (organization_member.member = $1 or organization.owner = $1)
      AND organization.id = $2`,
      [user.data.user.id, this.ctx.req.cookies[ORG_ID_COOKIE_KEY] || ""]
    );

    console.log(
      "query",
      `
      SELECT 
      organization_member.organization,
      organization_member.org_role
      FROM organization left join organization_member on organization.id = organization_member.organization
      WHERE (organization_member.member = '${
        user.data.user.id
      }' or organization.owner = '${user.data.user.id}')
      AND organization.id = '${this.ctx.req.cookies[ORG_ID_COOKIE_KEY] || ""}'`
    );
    if (!orgAccessCheck.data || orgAccessCheck.data.length === 0) {
      console.log("Unauthorized", orgAccessCheck);
      return { error: "Unauthorized", data: null };
    }

    return {
      data: {
        userId: user.data.user.id,
        orgId: orgAccessCheck.data[0].organization,
        user: user.data.user,
        role: orgAccessCheck.data[0].org_role,
      },
      error: null,
    };
  }
}
