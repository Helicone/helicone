import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import ExperimentsPage from "../../components/templates/prompts/experiments/table/experimentsPage";

const Experiments = () => {
  return <ExperimentsPage />;
};

export default Experiments;

Experiments.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};
