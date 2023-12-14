import { DEMO_EMAIL } from "./constants";
import { SSRContext, SupabaseServerWrapper } from "./wrappers/supabase";

/**
 * Redirects the user if they are already logged in.
 *
 * @param destination - The destination URL to redirect to.
 * @param getServerSideProps - A function that returns the server-side props for the current request.
 * @returns A function that can be used as a server-side props function.
 */
export function redirectIfLoggedIn(
  destination: string,
  getServerSideProps: (ctx: SSRContext<any>) => Promise<any>
): (ctx: SSRContext<any>) => any {
  return async (ctx: SSRContext<any>) => {
    const supabase = new SupabaseServerWrapper(ctx).getClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.email === DEMO_EMAIL) {
      supabase.auth.signOut();
      return await getServerSideProps(ctx);
    }

    if (session) {
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
