import { ReactElement } from "react";
import { NextPageWithLayout } from "./_app";
import AuthLayout from "../components/layout/authLayout";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import { GetServerSidePropsContext } from "next";
import FineTunePage from "../components/templates/fine-tune/fineTunePage";

interface FineTuningProps {
  searchQuery: string | null;
}

const FineTuning = (props: FineTuningProps) => {
  const { searchQuery } = props;
  return <FineTunePage searchQuery={searchQuery} />;
};

FineTuning.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default FineTuning;

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

  const { q } = ctx.query;

  return {
    props: {
      initialSession: session,
      user: session.user,
      searchQuery: q || null,
    },
  };
};
