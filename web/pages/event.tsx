import { GetServerSidePropsContext } from "next";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import Home from ".";

export default Home;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = new SupabaseServerWrapper(context).getClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user", session.user.id)
      .single();
    if (data === null) {
      return {
        redirect: {
          destination: "/welcome",
          permanent: false,
        },
      };
    }
  }
  return {
    props: {},
  };
};
