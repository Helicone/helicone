import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import { getPagination } from "../components/shared/getPagination";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import RequestsTab from "../components/templates/requests/requestsTab";
import { getRequests, ResponseAndRequest } from "../services/lib/requests";
import { Database } from "../supabase/database.types";

interface RequestsProps {
  initialSession: any;
  user: any;
  error: string | null;
  data: ResponseAndRequest[];
  count: number | null;
  page: number;
  from: number;
  to: number;
}

const Requests = (props: RequestsProps) => {
  const { data, error, count, page, from, to } = props;

  return (
    <MetaData title="Users">
      <AuthLayout>
        <RequestsTab
          requests={data}
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

export default Requests;

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
  const size = parseInt(page_size as string, 10) || 25;

  const { data, error, count, from, to } = await getRequests(
    supabase,
    currentPage,
    size
  );

  return {
    props: {
      initialSession: session,
      user: session.user,
      error: error?.message || null,
      data: (data as ResponseAndRequest[]) || [],
      count: count,
      page: currentPage,
      from: from,
      to: to,
    },
  };
};
