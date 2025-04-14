import { User } from "@supabase/auth-helpers-react";
import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { withAuthSSR } from "../../lib/api/handlerWrappers";
import EvaluatorsList from "../../components/templates/evals/EvaluatorsList";

interface EvalsProps {
  user: User;
}

const Evals = (props: EvalsProps) => {
  return <EvaluatorsList />;
};

Evals.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Evals;

export const getServerSideProps = withAuthSSR(async (options) => {
  return {
    props: {
      user: options.userData.user,
    },
  };
});
