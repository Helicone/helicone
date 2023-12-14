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

export interface HandlerWrapperNext<RetVal> {
  req: NextApiRequest;
  res: NextApiResponse<RetVal>;
}

export interface TimeFilter {
  start: Date;
  end: Date;
}

/**
 * Class representing a RequestBodyParser.
 * @class
 */
export class RequestBodyParser {
  private body: any;

  /**
   * Create a RequestBodyParser.
   * @constructor
   * @param {NextApiRequest} req - The NextApiRequest object.
   */
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

  /**
   * Get the filter from the request body.
   * @returns {Result<FilterNode, string>} The filter node or an error message.
   */
  getFilter(): Result<FilterNode, string> {
    if (this.body.filter) {
      return ok(this.body.filter);
    } else {
      return err("No filter provided");
    }
  }

  /**
   * Get the time filter from the request body.
   * @returns {Result<TimeFilter, string>} The time filter or an error message.
   */
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

/**
 * Options for the handler wrapper.
 */
export interface HandlerWrapperOptions<RetVal>
  extends HandlerWrapperNext<RetVal> {
  /**
   * The Supabase server wrapper.
   */
  supabaseClient: SupabaseServerWrapper<RetVal>;

  /**
   * User data.
   */
  userData: {
    userId: string;
    orgHasOnboarded: boolean;
    orgId: string;
    user: User;
    role: string;
  };

  /**
   * The request body parser.
   */
  body: RequestBodyParser;
}

/**
 * Represents the options for a handler wrapper in the API.
 * @template RetVal - The return value type of the handler.
 */
export interface HandlerWrapperOptionsAPI<RetVal>
  extends HandlerWrapperNext<RetVal> {
  userData?: HandlerWrapperOptions<RetVal>["userData"];
}

/**
 * Wraps a request handler function with authentication and permission checks.
 *
 * @param handler - The request handler function to be wrapped.
 * @param permissions - An optional array of permissions required for the handler.
 * @returns A wrapped request handler function.
 */
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
        hasPermission(data.role as Role, permission)
      )
    ) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await handler({
      req,
      res,
      supabaseClient,
      userData: data,
      body: new RequestBodyParser(req),
    });
  };
}

/**
 * Options for the server-side rendering (SSR) handler wrapper.
 */
export interface HandlerWrapperOptionsSSR<RetVal> {
  /**
   * The context object for the server-side rendering (SSR) handler.
   */
  context: GetServerSidePropsContext;

  /**
   * The Supabase server wrapper for the handler.
   */
  supabaseClient: SupabaseServerWrapper<RetVal>;

  /**
   * User data required for the handler.
   */
  userData: {
    /**
     * The ID of the user.
     */
    userId: string;

    /**
     * The ID of the organization.
     */
    orgId: string;

    /**
     * Indicates whether the organization has been onboarded.
     */
    orgHasOnboarded: boolean;

    /**
     * The user object.
     */
    user: User;
  };
}

/**
 * Higher-order function that adds authentication to a server-side rendering (SSR) function.
 *
 * @template T - The type of the options object passed to the `getServerSidePropsFunc`.
 * @param {function} getServerSidePropsFunc - The original server-side rendering function.
 * @returns {function} - The wrapped server-side rendering function with authentication.
 */
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
