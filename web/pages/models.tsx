import { User } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";

import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import ModelPage from "../components/templates/models/modelPage";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";

interface ModelProps {
  user: User;
}

const Dashboard = (props: ModelProps) => {
  const { user } = props;

  return (
    <MetaData title="Models">
      {/* <AuthLayout user={user}> */}
      <ModelPage />
      {/* </AuthLayout> */}
    </MetaData>
  );
};

export default Dashboard;

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
