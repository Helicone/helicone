import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import EvaluatorsList from "../../components/templates/evals/EvaluatorsList";

const Evals = () => {
  return <EvaluatorsList />;
};

Evals.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Evals;
