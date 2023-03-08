import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import RequestsPage from "../components/templates/requests/requestsPage";
import { getProperties } from "../lib/api/properties/properties";
import { unwrapAsync } from "../lib/result";
import { getPromptValues } from "../lib/api/prompts/prompts";
import LoadingAnimation from "../components/shared/loadingAnimation";
import { Database } from "../supabase/database.types";
import { getKeys } from "../services/lib/keys";

interface RequestsProps {
  user: any;
  page: number;
  pageSize: number;
  sortBy: string | null;
  keys: Database["public"]["Tables"]["user_api_keys"]["Row"][];
}

const Requests = (props: RequestsProps) => {
  const { user, page, pageSize, sortBy, keys } = props;

  return (
    <MetaData title="Requests">
      <AuthLayout user={user}>
        <RequestsPage
          page={page}
          pageSize={pageSize}
          sortBy={sortBy}
          keys={keys}
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

  const [{ data: keyData }] = await Promise.all([getKeys(supabase)]);

  if (!session)
    return {
      redirect: {
        destination: "/login",
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
      keys: keyData,
    },
  };
};
