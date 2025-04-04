import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import ExperimentsPage from "../../components/templates/prompts/experiments/table/experimentsPage";

interface ExperimentPage {}

const Experiments = (props: ExperimentPage) => {
  return <ExperimentsPage />;
};

export default Experiments;

Experiments.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};
