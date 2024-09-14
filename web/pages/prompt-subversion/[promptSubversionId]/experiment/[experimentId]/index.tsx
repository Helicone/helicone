import { User } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";

import { ReactElement } from "react";
import AuthLayout from "../../../../../components/layout/auth/authLayout";
import { SupabaseServerWrapper } from "../../../../../lib/wrappers/supabase";
import ExperimentIdPage from "../../../../../components/templates/prompts/experiments/id/experimentIdPage";
import ExperimentTablePage from "@/components/templates/prompts/experiments/experimentTablePage";

interface ExperimentPage {
  user: User;
  experimentId: string;
  promptSubversionId: string;
}

const Experiments = (props: ExperimentPage) => {
  const { user, experimentId, promptSubversionId } = props;

  return (
    <ExperimentTablePage
      experimentId={experimentId}
      promptSubversionId={promptSubversionId}
    />
  );
};

export default Experiments;

Experiments.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

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

  // get the id from the query params
  const promptSubversionId = context.params?.promptSubversionId as string;
  const experimentId = context.params?.experimentId as string;

  return {
    props: {
      initialSession: session,
      user: session.user,
      promptSubversionId,
      experimentId,
    },
  };
};
