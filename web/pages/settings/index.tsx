import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { NextPageWithLayout } from "../_app";

import AuthLayout from "../../components/layout/auth/authLayout";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";
import { ReactElement } from "react";
import SettingsLayout from "@/components/templates/settings/settingsLayout";
import OrgSettingsPage from "@/components/templates/organization/settings/orgSettingsPage";
import { useOrg } from "@/components/layout/org/organizationContext";

const Settings: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = () => {
  const orgContext = useOrg();
  return orgContext?.currentOrg ? (
    <OrgSettingsPage org={orgContext.currentOrg} />
  ) : null;
};

Settings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default Settings;

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
