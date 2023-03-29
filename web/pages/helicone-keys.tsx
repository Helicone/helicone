import {
  createServerSupabaseClient,
  User,
} from "@supabase/auth-helpers-nextjs";

import { GetServerSidePropsContext } from "next";
import AuthHeader from "../components/shared/authHeader";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import { HeliconeKeyPage } from "../components/templates/helicone-keys/heliconeKeyPage";
import KeyPage from "../components/templates/keys/keyPage";

interface KeysProps {
  user: User;
}

const Keys = (props: KeysProps) => {
  const { user } = props;

  return (
    <MetaData title="Keys">
      <AuthLayout user={user}>
        <AuthHeader title="Helicone API Keys" />
        <HeliconeKeyPage />
      </AuthLayout>
    </MetaData>
  );
};

export default Keys;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // Create authenticated Supabase Client
  const supabase = createServerSupabaseClient(ctx);
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
