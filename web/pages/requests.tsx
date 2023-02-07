import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import { getPagination } from "../components/shared/getPagination";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import RequestsTab from "../components/templates/requests/requestsTab";
import { getRequests } from "../services/lib/requests";
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

export type ResponseAndRequest = Omit<
  Database["public"]["Views"]["response_and_request_rbac"]["Row"],
  "response_body" | "request_body"
> & {
  response_body: {
    choices:
      | {
          text: string;
          logprobs: {
            token_logprobs: number[];
          };
        }[]
      | null;
    usage:
      | {
          total_tokens: number;
        }
      | null
      | undefined;
    model: string;
  } | null;
  request_body: {
    prompt: string;
    max_tokens: number;
    model: string;
    temperature: number;
  } | null;
};

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

  const { from, to } = getPagination(currentPage - 1, pageSize);

  const { data, error, count } = await getRequests(supabase, from, to);

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
