// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import { Result, err, ok } from "../result";
import { SupabaseServerWrapper } from "../wrappers/supabase";
import { User } from "@supabase/auth-helpers-nextjs";
import { FilterNode } from "../../services/lib/filters/filterDefs";
import { Permission, Role, hasPermission } from "../../services/lib/user";
import { IVault } from "../../services/lib/vault.ts/IVault";
import HashiCorpVault from "../../services/lib/vault.ts/HashiCorpVault";

export interface HandlerWrapperNext<RetVal> {
  req: NextApiRequest;
  res: NextApiResponse<RetVal>;
}

export interface TimeFilter {
  start: Date;
  end: Date;
}

export class RequestBodyParser {
  private body: any;
  constructor(private req: NextApiRequest) {
    try {
      if (typeof req.body === "string" && req.body.length > 0) {
        this.body = JSON.parse(req.body);
      } else {
        this.body = req.body;
      }
    } catch (e) {
      console.error("RequestBodyParser", e, req.body);
      this.body = {};
    }
  }
  getFilter(): Result<FilterNode, string> {
    if (this.body.filter) {
      return ok(this.body.filter);
    } else {
      return err("No filter provided");
    }
  }

  getTimeFilter(): Result<TimeFilter, string> {
    try {
      if (this.body.timeFilter) {
        return ok({
          start: new Date(this.body.timeFilter.start),
          end: new Date(this.body.timeFilter.end),
        });
      } else {
        return err("No time filter provided");
      }
    } catch (e) {
      return err(
        "Invalid time filter" + JSON.stringify(this.body.timeFilter) + e
      );
    }
  }
}
export interface HandlerWrapperOptions<RetVal>
  extends HandlerWrapperNext<RetVal> {
  supabaseClient: SupabaseServerWrapper<RetVal>;
  vault: IVault | null;
  userData: {
    userId: string;
    orgId: string;
    user: User;
    role: string;
  };
  body: RequestBodyParser;
}

export interface HandlerWrapperOptionsAPI<RetVal>
  extends HandlerWrapperNext<RetVal> {
  userData?: HandlerWrapperOptions<RetVal>["userData"];
}

export function withAuth<T>(
  handler: (supabaseServer: HandlerWrapperOptions<T>) => Promise<void>,
  permissions?: Permission[]
) {
  return async (
    req: NextApiRequest,
    res: NextApiResponse<T | { error: string }>
  ) => {
    const supabaseClient = new SupabaseServerWrapper({
      req,
      res,
    });
    const { data, error } = await supabaseClient.getUserAndOrg();
    if (error !== null || !data.orgId || !data.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Check permissions
    if (
      permissions &&
      permissions.length > 0 &&
      !permissions.every((permission) =>
        hasPermission(data.role as Role, permission)
      )
    ) {
      console.log("User does not have required permissions");
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    let vault: IVault | null = null;
    if ((process.env.NEXT_PUBLIC_VAULT_ENABLED ?? "") === "true") {
      vault = new HashiCorpVault();
    }

    await handler({
      req,
      res,
      supabaseClient,
      userData: data,
      vault,
      body: new RequestBodyParser(req),
    });
  };
}

export interface HandlerWrapperOptionsSSR<RetVal> {
  context: GetServerSidePropsContext;
  supabaseClient: SupabaseServerWrapper<RetVal>;
  userData: {
    userId: string;
    orgId: string;
    user: User;
  };
}

export function withAuthSSR<T>(
  getServerSidePropsFunc: (
    options: HandlerWrapperOptionsSSR<T>
  ) => ReturnType<GetServerSideProps>
) {
  return async (
    context: GetServerSidePropsContext
  ): Promise<ReturnType<GetServerSideProps>> => {
    const supabaseClient = new SupabaseServerWrapper(context);
    const { data, error } = await supabaseClient.getUserAndOrg();
    if (error !== null || !data.orgId || !data.userId) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    } else {
      return await getServerSidePropsFunc({
        context,
        supabaseClient,
        userData: data,
      });
    }
  };
}
