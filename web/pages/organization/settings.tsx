import {
  createServerSupabaseClient,
  User,
} from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";

import AuthHeader from "../../components/shared/authHeader";
import AuthLayout from "../../components/shared/layout/authLayout";
import MetaData from "../../components/shared/metaData";
import { useOrg } from "../../components/shared/layout/organizationContext";
import OrgSettingsPage from "../../components/templates/organization/settings/orgSettingsPage";

interface SettingsProps {
  user: User;
}

const Settings = (props: SettingsProps) => {
  const { user } = props;

  const org = useOrg();

  return (
    <MetaData title="Settings">
      <AuthLayout user={user}>
        <AuthHeader title="Organization Settings" />
        {!org?.currentOrg ? (
          <h1>Loading...</h1>
        ) : (
          <OrgSettingsPage org={org?.currentOrg!} />
        )}
      </AuthLayout>
    </MetaData>
  );
};

export default Settings;

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
