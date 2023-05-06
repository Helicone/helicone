import {
  SupabaseClient,
  createServerSupabaseClient,
} from "@supabase/auth-helpers-nextjs";
import { Database } from "../../supabase/database.types";
import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";

export type SSRContext<T> =
  | { req: NextApiRequest; res: NextApiResponse<T> }
  | GetServerSidePropsContext;

export class SupabaseServerWrapper<T> {
  client: SupabaseClient<Database>;
  constructor(ctx: SSRContext<T>) {
    this.client = createServerSupabaseClient<Database>(ctx, {
      supabaseUrl: process.env.SUPABASE_URL ?? "",
    });
  }

  getClient() {
    return this.client;
  }
}
