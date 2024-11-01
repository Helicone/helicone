import { GetServerSidePropsContext } from "next";
import { User } from "@supabase/auth-helpers-react";
import { ReactElement } from "react";
import AuthLayout from "../../../components/layout/auth/authLayout";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";
import ExperimentTablePage from "../../../components/templates/prompts/experiments/table/experimentTablePage";

interface ExperimentIdPage {
  user: User;
  experimentTableId: string;
}

const ExperimentId = (props: ExperimentIdPage) => {
  return <ExperimentTablePage experimentTableId={props.experimentTableId} />;
};

export default ExperimentId;

ExperimentId.getLayout = function getLayout(page: ReactElement) {
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
  return {
    props: {
      user: session.user,
      experimentTableId: context.params?.id,
    },
  };
};
