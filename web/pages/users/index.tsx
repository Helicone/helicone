import { GetServerSidePropsContext } from "next";

import { ReactElement } from "react";
import { SortDirection } from "../../services/lib/sorts/users/sorts";
import UsersPageV2 from "../../components/templates/users/usersPageV2";
import AuthLayout from "../../components/layout/auth/authLayout";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";

interface UsersProps {
  page: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
}

const Users = (props: UsersProps) => {
  const { page, pageSize, sort } = props;

  return <UsersPageV2 currentPage={page} pageSize={pageSize} sort={sort} />;
};

Users.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Users;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { page, page_size, sortKey, sortDirection, isCustomProperty } =
    context.query;

  const currentPage = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(page_size as string, 10) || 25;

  return {
    props: {
      page: currentPage,
      pageSize: pageSize,
      sort: {
        sortKey: sortKey ? (sortKey as string) : null,
        sortDirection: sortDirection ? (sortDirection as SortDirection) : null,
        isCustomProperty: isCustomProperty === "true",
      },
    },
  };
};
