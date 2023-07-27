import {
  createServerSupabaseClient,
  User,
} from "@supabase/auth-helpers-nextjs";

import { GetServerSidePropsContext } from "next";
import AuthHeader from "../../components/shared/authHeader";
import AuthLayout from "../../components/shared/layout/authLayout";
import MetaData from "../../components/shared/metaData";
import KeyPage from "../../components/templates/keys/keyPage";
import OrgsPage from "../../components/templates/organizations/orgsPage";

interface OrgProps {
  user: User;
}

const Org = (props: OrgProps) => {
  const { user } = props;

  return (
    <MetaData title="Organizations">
      <AuthLayout user={user}>
        <AuthHeader title="Organizations" />
        <OrgsPage />
      </AuthLayout>
    </MetaData>
  );
};

export default Org;

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
