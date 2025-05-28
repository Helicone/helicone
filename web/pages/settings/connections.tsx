import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import ConnectionsPage from "../../components/templates/connections/connectionsPage";
import { GetServerSidePropsContext } from "next";
import { SortDirection } from "../../services/lib/sorts/requests/sorts";
import SettingsLayout from "@/components/templates/settings/settingsLayout";

const Connections = () => {
  return <ConnectionsPage />;
};

Connections.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default Connections;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { page, page_size, sortKey, sortDirection, isCustomProperty, tab } =
    context.query;

  const currentPage = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(page_size as string, 10) || 10;

  return {
    props: {
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
};
