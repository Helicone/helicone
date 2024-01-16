import { User } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../components/shared/layout/authLayout";
import UsersPageV2 from "../components/templates/users/usersPageV2";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import { SortDirection } from "../services/lib/sorts/users/sorts";
import { ReactElement } from "react";

interface UsersProps {
  user: User;
  page: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
}

const Users = (props: UsersProps) => {
  const { user, page, pageSize, sort } = props;

  return <UsersPageV2 currentPage={page} pageSize={pageSize} sort={sort} />;
};

Users.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Users;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = new SupabaseServerWrapper(context).getClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  const { page, page_size, sortKey, sortDirection, isCustomProperty } =
    context.query;

  const currentPage = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(page_size as string, 10) || 25;

  return {
    props: {
      initialSession: session,
      user: session.user,
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
