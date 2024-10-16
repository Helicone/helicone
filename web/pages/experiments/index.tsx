import { GetServerSidePropsContext } from "next";
import { User } from "@supabase/auth-helpers-react";
import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";
import ExperimentTablePageEmpty from "../../components/templates/prompts/experiments/table/experimentTablePageEmpty";

interface ExperimentPage {
  user: User;
}

const Experiments = (props: ExperimentPage) => {
  return <ExperimentTablePageEmpty />;
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
  return {
    props: {
      user: session.user,
    },
  };
};
