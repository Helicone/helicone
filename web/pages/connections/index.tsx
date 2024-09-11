import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import ConnectionsPage from "../../components/templates/connections/connectionsPage";
import { withAuthSSR } from "../../lib/api/handlerWrappers";
import { SortDirection } from "../../services/lib/sorts/requests/sorts";

const Connections = () => {
  return <ConnectionsPage />;
};

Connections.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Connections;

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
