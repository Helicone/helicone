import {
  createServerSupabaseClient,
  User,
} from "@supabase/auth-helpers-nextjs";

import { GetServerSidePropsContext } from "next";
import AuthHeader from "../../components/shared/authHeader";
import AuthLayout from "../../components/shared/layout/authLayout";
import MetaData from "../../components/shared/metaData";
import OrgIdPage from "../../components/templates/organization/orgIdPage";
import { useOrg } from "../../components/shared/layout/organizationContext";
import { getOrCreateUserSettings } from "../api/user_settings";

interface OrgProps {
  user: User;
}

const Org = (props: OrgProps) => {
  const { user } = props;

  const org = useOrg();

  return (
    <MetaData title="Organizations">
      <AuthLayout user={user}>
        <AuthHeader title="Organization" />
        {!org?.currentOrg ? (
          <h1>Loading...</h1>
        ) : (
          <OrgIdPage org={org?.currentOrg!} />
        )}
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

  await getOrCreateUserSettings(session.user);

  return {
    props: {
      initialSession: session,
      user: session.user,
    },
  };
};
