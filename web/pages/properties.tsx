import { User, useUser } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import PropertiesPage from "../components/templates/properties/propertiesPage";
import { withAuthSSR } from "../lib/api/handlerWrappers";
import { requestOverLimit } from "../lib/checkRequestLimit";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import { Database } from "../supabase/database.types";
import { checkOnboardedAndUpdate } from "./api/user/checkOnboarded";

interface PropertiesProps {
  user: User;
}

const Properties = (props: PropertiesProps) => {
  const { user } = props;
  return (
    <MetaData title="Properties">
      <AuthLayout user={user}>
        <PropertiesPage />
      </AuthLayout>
    </MetaData>
  );
};

export default Properties;

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
