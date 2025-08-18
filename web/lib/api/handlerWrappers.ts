import { getSSRHeliconeAuthClient } from "@/packages/common/auth/client/getSSRHeliconeAuthClient";
import { HeliconeAuthClient } from "@/packages/common/auth/client/HeliconeAuthClient";
import { HeliconeUser } from "@/packages/common/auth/types";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import { Database } from "../../db/database.types";
import { Result, err, ok } from "@/packages/common/result";
import { FilterNode, TimeFilter } from "@helicone-package/filters/filterDefs";
import { Permission, Role, hasPermission } from "../../services/lib/user";
import { dbExecute } from "./db/dbExecute";
import { logger } from "@/lib/telemetry/logger";

export interface HandlerWrapperNext<RetVal> {
  req: NextApiRequest;
  res: NextApiResponse<RetVal>;
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
      logger.error({ error: e, body: req.body }, "RequestBodyParser error");
      this.body = {};
    }
  }

  get<T>(): T {
    return this.body;
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
        "Invalid time filter" + JSON.stringify(this.body.timeFilter) + e,
      );
    }
  }
}
export interface HandlerWrapperOptions<RetVal>
  extends HandlerWrapperNext<RetVal> {
  heliconeClient: HeliconeAuthClient;
  userData: {
    userId: string;
    orgHasOnboarded: boolean;
    orgId: string;
    org?: Database["public"]["Tables"]["organization"]["Row"];
    user: HeliconeUser;
    role: string;
  };
  body: RequestBodyParser;
}

export interface HandlerWrapperOptionsAPI<RetVal>
  extends HandlerWrapperNext<RetVal> {
  userData?: HandlerWrapperOptions<RetVal>["userData"];
}

export function withAuth<T>(
  handler: (heliconeClient: HandlerWrapperOptions<T>) => Promise<void>,
  permissions?: Permission[],
) {
  return async (
    req: NextApiRequest,
    res: NextApiResponse<T | { error: string }>,
  ) => {
    const client = await getSSRHeliconeAuthClient({ ctx: { req, res } });

    const user = await client.getUser();
    const org = await client.getOrg();

    if (org.error || !org.data || !user.data || user.error) {
      res.status(401).json({
        error: `Unauthorized: error`,
      });
      return;
    }

    // Check permissions
    if (
      permissions &&
      permissions.length > 0 &&
      !permissions.every((permission) =>
        hasPermission(org.data.role as Role, permission),
      )
    ) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await handler({
      req,
      res,
      heliconeClient: client,
      userData: {
        orgHasOnboarded: org.data.org.has_onboarded,
        orgId: org.data.org.id,
        org: org.data.org,
        user: user.data,
        role: org.data.role,
        userId: user.data.id,
      },
      body: new RequestBodyParser(req),
    });
  };
}

export interface HandlerWrapperOptionsSSR<RetVal> {
  context: GetServerSidePropsContext;
  userData: {
    userId: string;
  };
}

export function withAuthSSR<T>(
  getServerSidePropsFunc: (
    options: HandlerWrapperOptionsSSR<T>,
  ) => ReturnType<GetServerSideProps>,
) {
  return async (
    context: GetServerSidePropsContext,
  ): Promise<ReturnType<GetServerSideProps>> => {
    const authClient = await getSSRHeliconeAuthClient({ ctx: context });

    const user = await authClient.getUser();

    if (user.error || !user.data) {
      return {
        redirect: {
          destination: "/signin?unauthorized=true",
          permanent: false,
        },
      };
    } else {
      return await getServerSidePropsFunc({
        context,
        userData: {
          userId: user.data.id,
        },
      });
    }
  };
}

export const withAdminSSR = withAuthSSR(async (options) => {
  const {
    userData: { userId },
  } = options;

  const { data, error } = await dbExecute<{ user_id: string }>(
    "SELECT user_id FROM admins WHERE user_id = $1",
    [userId],
  );

  const admins = data?.map((admin) => admin.user_id || "") || [];

  if (error) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  if (!admins.includes(userId || "")) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
});
