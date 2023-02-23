import {
  createServerSupabaseClient,
  User,
} from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import UsersPage from "../components/templates/users/usersPage";

interface UsersProps {
  user: User;
  page: number;
  pageSize: number;
}

const Users = (props: UsersProps) => {
  const { user, page, pageSize } = props;

  return (
    <MetaData title="Users">
      <AuthLayout user={user}>
        <UsersPage page={page} pageSize={pageSize} />
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

  return {
    props: {
      initialSession: session,
      user: session.user,
      page: currentPage,
      pageSize: pageSize,
    },
  };
};
