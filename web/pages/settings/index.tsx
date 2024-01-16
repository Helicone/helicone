import type { ReactElement } from "react";
import { NextPageWithLayout } from "../_app";
import { GetServerSidePropsContext } from "next";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";
import SettingsPage from "../../components/templates/settings/settingsPage";
import AuthLayout from "../../components/shared/layout/authLayout";

const Settings: NextPageWithLayout = () => {
  return <SettingsPage />;
};

Settings.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
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
