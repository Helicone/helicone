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
import { supabaseUrl as serverSupabaseUrl } from "../supabaseServer";

export type SSRContext<T> =
  | { req: NextApiRequest; res: NextApiResponse<T> }
  | GetServerSidePropsContext;

interface SupabaseServerWrapperOptions {
  supabaseUrl: string;
}
export class SupabaseServerWrapper<T> {
  client: SupabaseClient<Database>;
  constructor(ctx: SSRContext<T>, options?: SupabaseServerWrapperOptions) {
    const supabaseUrl = options?.supabaseUrl ?? serverSupabaseUrl ?? "";

    this.client = createServerSupabaseClient<Database>(ctx, {
      supabaseUrl,
    });
  }

  getClient() {
    return this.client;
  }
}
