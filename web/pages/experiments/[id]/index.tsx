import { ReactElement } from "react";
import AuthLayout from "../../../components/layout/auth/authLayout";
import { ExperimentTable } from "../../../components/templates/prompts/experiments/table/ExperimentTable";
import { GetServerSidePropsContext } from "next";

interface ExperimentIdPage {
  experimentTableId: string;
}

const ExperimentId = (props: ExperimentIdPage) => {
  return <ExperimentTable experimentTableId={props.experimentTableId} />;
};

export default ExperimentId;

ExperimentId.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { id } = context.params ?? {};
  return {
    props: { experimentTableId: id },
  };
};
