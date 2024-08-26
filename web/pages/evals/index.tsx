import AuthLayout from "../../components/layout/authLayout";
import { withAuthSSR } from "../../lib/api/handlerWrappers";
import { User } from "@supabase/auth-helpers-react";
import { SortDirection } from "../../services/lib/sorts/requests/sorts";
import { ReactElement } from "react";
import EvalsPage from "../../components/templates/evals/EvalsPage";

interface EvalsProps {
  user: User;
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  defaultIndex: number;
}

const Evals = (props: EvalsProps) => {
  const { currentPage, pageSize, sort, defaultIndex } = props;
  return <EvalsPage />;
};

Evals.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Evals;

export const getServerSideProps = withAuthSSR(async (options) => {
  const { page, page_size, sortKey, sortDirection, isCustomProperty, tab } =
    options.context.query;

  const currentPage = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(page_size as string, 10) || 10;

  return {
    props: {
      user: options.userData.user,
      currentPage,
      pageSize,
      sort: {
        sortKey: sortKey ? (sortKey as string) : null,
        sortDirection: sortDirection ? (sortDirection as SortDirection) : null,
        isCustomProperty: isCustomProperty === "true",
      },
      defaultIndex: tab ? parseInt(tab as string) : 0,
    },
  };
});
