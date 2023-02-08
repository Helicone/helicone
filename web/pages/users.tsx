import {
  createServerSupabaseClient,
  User,
} from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import UsersPage from "../components/templates/users/usersPage";
import { getUsers, UserRow } from "../services/lib/users";

interface UsersProps {
  user: User;
  data: UserRow[];
  error: string | null;
  count: number | null;
  page: number;
  from: number;
  to: number;
}

const Users = (props: UsersProps) => {
  const { user, data, error, count, page, from, to } = props;

  return (
    <MetaData title="Users">
      <AuthLayout user={user}>
        <UsersPage
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

  const { page, page_size } = context.query;

  let currentPage = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(page_size as string, 10) || 25;

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
