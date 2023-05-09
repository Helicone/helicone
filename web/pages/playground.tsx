import { GetServerSidePropsContext } from "next";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import { User } from "@supabase/auth-helpers-nextjs";
import MetaData from "../components/shared/metaData";
import AuthLayout from "../components/shared/layout/authLayout";
import AuthHeader from "../components/shared/authHeader";

interface PlaygroundProps {
  user: User;
}

const Playground = (props: PlaygroundProps) => {
  const { user } = props;

  return (
    <MetaData title="Playground">
      <AuthLayout user={user}>
        <AuthHeader title="Playground" />
        <h1>Hello Playground</h1>
      </AuthLayout>
    </MetaData>
  );
};

export default Playground;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // Create authenticated Supabase Client
  const supabase = new SupabaseServerWrapper(ctx).getClient();
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  return {
    props: {
      initialSession: session,
      user: session.user,
    },
  };
};
