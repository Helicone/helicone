import { SSRContext, SupabaseServerWrapper } from "./wrappers/supabase";

/**
 * Redirects the user to a specified destination if they are logged out.
 *
 * @param destination - The destination URL to redirect to.
 * @param getServerSideProps - A function that returns the server-side props.
 * @returns A function that can be used as a server-side props function.
 */
export function redirectIfLoggedOut(
  destination: string,
  getServerSideProps: (ctx: SSRContext<any>) => Promise<any>
): (ctx: SSRContext<any>) => any {
  return async (ctx: SSRContext<any>) => {
    const supabase = new SupabaseServerWrapper(ctx).getClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return {
        redirect: {
          destination,
          permanent: false,
        },
      };
    }
    return await getServerSideProps(ctx);
  };
}
