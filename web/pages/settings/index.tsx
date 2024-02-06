import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { NextPageWithLayout } from "../_app";
import SettingsPage from "../../components/templates/settings/settingsPage";
import AuthLayout from "../../components/layout/authLayout";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";
import { ReactElement } from "react";

const Settings: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = (props) => {
  return <SettingsPage defaultIndex={props.defaultIndex} />;
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

  const { tab } = ctx.query;

  return {
    props: {
      initialSession: session,
      user: session.user,
      defaultIndex: tab ? parseInt(tab as string) : 0,
    },
  };
};
