import { GetServerSidePropsContext } from "next";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import RequestsPage from "../components/templates/requests/requestsPage";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";

interface RequestsProps {
  user: any;
  page: number;
  pageSize: number;
  sortBy: string | null;
}

const Requests = (props: RequestsProps) => {
  const { user, page, pageSize, sortBy } = props;

  return (
    <MetaData title="Requests">
      <AuthLayout user={user}>
        <RequestsPage page={page} pageSize={pageSize} sortBy={sortBy} />
      </AuthLayout>
    </MetaData>
  );
};

export default Requests;

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

  const { page, page_size, sort } = context.query;

  const currentPage = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(page_size as string, 10) || 25;
  const sortBy = (sort as string) || null;

  return {
    props: {
      initialSession: session,
      user: session.user,
      page: currentPage,
      pageSize: pageSize,
      sortBy: sortBy,
    },
  };
};
