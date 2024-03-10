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
import { getSupabaseUrl } from "../supabaseServer";
import { ORG_ID_COOKIE_KEY } from "../constants";
import { Result, ok } from "../result";

export type SSRContext<T> =
  | { req: NextApiRequest; res: NextApiResponse<T> }
  | GetServerSidePropsContext;

interface SupabaseServerWrapperOptions {
  supabaseUrl?: string;
}
export class SupabaseServerWrapper<T> {
  private client: SupabaseClient<Database> | null = null;
  private ctx: SSRContext<T>;
  private options: SupabaseServerWrapperOptions;
  constructor(ctx: SSRContext<T>, options?: SupabaseServerWrapperOptions) {
    this.ctx = ctx;
    this.options = options || {};
  }

  getClient() {
    if (!this.client) {
      const supabaseUrl = this.options.supabaseUrl ?? getSupabaseUrl();
      this.client = createServerSupabaseClient<Database>(this.ctx, {
        supabaseUrl,
      });
    }
    return this.client;
  }

  async getUserAndOrg(): Promise<
    Result<
      {
        userId: string;
        orgId: string;
        org?: Database["public"]["Tables"]["organization"]["Row"];
        orgHasOnboarded: boolean;
        user: User;
        role: string;
      },
      string
    >
  > {
    const user = await this.getClient().auth.getUser();
    if (!user.data || !user.data.user) {
      return { error: "Unauthorized User", data: null };
    }

    const orgAccessCheck = await this.getClient()
      .from("organization")
      .select("*")
      .eq("id", this.ctx.req.cookies[ORG_ID_COOKIE_KEY]);

    if (orgAccessCheck.data?.length === 0) {
      return ok({
        userId: user.data.user.id,
        orgId: "na",
        orgHasOnboarded: false,
        user: user.data.user,
        role: "owner",
      });
    }
    if (!orgAccessCheck.data || orgAccessCheck.error !== null) {
      return {
        error: `Unauthorized orgChecking ${this.ctx.req.cookies[ORG_ID_COOKIE_KEY]}`,
        data: null,
      };
    }
    const org = orgAccessCheck.data[0];

    // If owner, return role as owner
    if (org.owner === user.data.user.id) {
      return {
        data: {
          userId: user.data.user.id,
          orgId: org.id,
          org: org,
          orgHasOnboarded: org.has_onboarded,
          user: user.data.user,
          role: "owner",
        },
        error: null,
      };
    }

    const checkMembership = async (orgId: string) => {
      const memberCheck = await this.getClient()
        .from("organization_member")
        .select("*")
        .eq("member", user.data.user?.id)
        .eq("organization", orgId)
        .single();

      return memberCheck.data ? memberCheck.data.org_role : null;
    };

    const role =
      (await checkMembership(org.id)) ||
      (org.reseller_id && (await checkMembership(org.reseller_id)));

    if (!role) {
      return { error: "Unauthorized", data: null };
    }

    return {
      data: {
        userId: user.data.user.id,
        orgId: org.id,
        orgHasOnboarded: org.has_onboarded,
        user: user.data.user,
        role: role,
        org: org,
      },
      error: null,
    };
  }
}
