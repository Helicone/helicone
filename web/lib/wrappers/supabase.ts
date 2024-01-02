import {
  SupabaseClient,
  User,
  createServerSupabaseClient,
} from "@supabase/auth-helpers-nextjs";
import { Database } from "../../supabase/database.types";
import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import { supabaseUrl as serverSupabaseUrl } from "../supabaseServer";
import { ORG_ID_COOKIE_KEY } from "../constants";
import { Result } from "../result";

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
    this.client = createServerSupabaseClient<Database>(ctx, {
      supabaseUrl,
    });
  }

  getClient() {
    return this.client;
  }

  async getUserAndOrg(): Promise<
    Result<
      {
        userId: string;
        orgId: string;
        orgHasOnboarded: boolean;
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

    const orgAccessCheck = await this.client
      .from("organization")
      .select("*")
      .eq("id", this.ctx.req.cookies[ORG_ID_COOKIE_KEY])
      .single();

    if (!orgAccessCheck.data || orgAccessCheck.error !== null) {
      return {
        error: `Unauthorized orgChecking ${this.ctx.req.cookies[ORG_ID_COOKIE_KEY]}`,
        data: null,
      };
    }

    // If owner, return role as owner
    if (orgAccessCheck.data.owner === user.data.user.id) {
      return {
        data: {
          userId: user.data.user.id,
          orgId: orgAccessCheck.data.id,
          orgHasOnboarded: orgAccessCheck.data.has_onboarded,
          user: user.data.user,
          role: "owner",
        },
        error: null,
      };
    }

    // If not owner, check if member
    const orgMember = await this.client
      .from("organization_member")
      .select("*")
      .eq("member", user.data.user.id)
      .eq("organization", orgAccessCheck.data.id)
      .single();

    if (!orgMember.data || orgMember.error !== null) {
      return {
        error: "Unauthorized",
        data: null,
      };
    }

    return {
      data: {
        userId: user.data.user.id,
        orgId: orgAccessCheck.data.id,
        orgHasOnboarded: orgAccessCheck.data.has_onboarded,
        user: user.data.user,
        role: orgMember.data.org_role,
      },
      error: null,
    };
  }
}
