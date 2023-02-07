import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import UsersTab from "../components/templates/users/usersTab";
import { getUsers, UserRow } from "../services/lib/users";

interface UsersProps {
  data: UserRow[];
  error: string | null;
  count: number | null;
  page: number;
  from: number;
  to: number;
}

const Users = (props: UsersProps) => {
  const { data, error, count, page, from, to } = props;

  return (
    <MetaData title="Users">
      <AuthLayout>
        <UsersTab
          users={data}
          error={error}
          count={count}
          page={page}
          from={from}
          to={to}
        />
      </AuthLayout>
    </MetaData>
  );
};

export default Users;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = createServerSupabaseClient(context);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };

  let currentPage = parseInt(context.query.page as string, 10) || 1;

  const pageSize = 25;

  const { data, error, count, from, to } = await getUsers(
    supabase,
    currentPage,
    pageSize
  );

  return {
    props: {
      initialSession: session,
      user: session.user,
      error: error?.message || null,
      data: (data as UserRow[]) || [],
      count: count,
      page: currentPage,
      from: from,
      to: to,
    },
  };
};
