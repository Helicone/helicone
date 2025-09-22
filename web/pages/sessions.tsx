import AuthLayout from "../components/layout/auth/authLayout";
import { SortDirection } from "../services/lib/sorts/requests/sorts";
import { ReactElement } from "react";
import SessionsPage from "../components/templates/sessions/sessionsPage";
import { GetServerSidePropsContext } from "next";
interface SessionsProps {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  defaultIndex: number;
  selectedName: string | null;
}

const Sessions = (props: SessionsProps) => {
  const { currentPage, pageSize, sort, defaultIndex, selectedName } = props;
  return (
    <SessionsPage
      currentPage={currentPage}
      pageSize={pageSize}
      sort={sort}
      defaultIndex={defaultIndex}
      selectedName={selectedName ?? undefined}
    />
  );
};

Sessions.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Sessions;

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const {
    page,
    page_size,
    sortKey,
    sortDirection,
    isCustomProperty,
    tab,
    name,
  } = context.query;

  const currentPage = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(page_size as string, 10) || 50;

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
      selectedName: name ? (name as string) : null,
    },
  };
};
