import { User } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import PlaygroundPage from "../components/templates/playground/playgroundPage";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";

interface PlaygroundProps {
  user: User;
}

const Playground = (props: PlaygroundProps) => {
  const { user } = props;

  return (
    <MetaData title="Playground">
      <AuthLayout user={user}>
        <PlaygroundPage />
      </AuthLayout>
    </MetaData>
  );
};

export default Playground;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = new SupabaseServerWrapper(context).getClient();
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
