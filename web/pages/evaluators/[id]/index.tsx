import { ReactElement } from "react";
import AuthLayout from "../../../components/layout/auth/authLayout";
import { withAuthSSR } from "../../../lib/api/handlerWrappers";
import EvaluatorPage from "@/components/templates/evals/id/EvaluatorPage";

interface DatasetProps {
  id: string;
  currentPage: number;
  pageSize: number;
}

const Dataset = (props: DatasetProps) => {
  const { id, currentPage, pageSize } = props;

  return <EvaluatorPage />;
};

export default Dataset;

Dataset.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export const getServerSideProps = withAuthSSR(async (options) => {
  const { page, page_size, sortKey, sortDirection, isCustomProperty, tab } =
    options.context.query;

  const currentPage = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(page_size as string, 10) || 10;
  const id = options.context.params?.id as string;

  return {
    props: {
      user: options.userData.user,
      id,
      currentPage,
      pageSize,
    },
  };
});
