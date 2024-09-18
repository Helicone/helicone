import {
  SupabaseClient,
  User,
  createPagesServerClient,
} from "@supabase/auth-helpers-nextjs";
import { Database } from "../../supabase/database.types";
import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import { supabaseUrl as serverSupabaseUrl } from "../supabaseServer";
import { ORG_ID_COOKIE_KEY } from "../constants";
import { Result, ok } from "../result";

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
    const user = await this.client.auth.getUser();
    if (!user.data || !user.data.user) {
      return { error: "Unauthorized User", data: null };
    }

    const orgAccessCheck = await this.client
      .from("organization")
      .select("*")
      .eq("id", this.ctx.req.cookies[ORG_ID_COOKIE_KEY] || "");

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
      const memberCheck = await this.client
        .from("organization_member")
        .select("*")
        .eq("member", user.data.user?.id ?? "")
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
