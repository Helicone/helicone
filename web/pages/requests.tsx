import { User } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import RequestsPageV2 from "../components/templates/requestsV2/requestsPageV2";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import { SortDirection } from "../services/lib/sorts/requests/sorts";
import RequestsPage from "../components/templates/requestsV3/requestsPage";

interface RequestsV2Props {
  user: User;
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  query: any;
  initialRequestId: string | null;
}

const RequestsV2 = (props: RequestsV2Props) => {
  const { user, currentPage, pageSize, sort, query, initialRequestId } = props;

  return (
    <MetaData title={"Requests"}>
      <AuthLayout user={user}>
        <RequestsPage
          page={currentPage}
          currentPageSize={pageSize}
          sort={sort}
        />
        {JSON.stringify(query)}
        <RequestsPageV2
          currentPage={currentPage}
          pageSize={pageSize}
          sort={sort}
          initialRequestId={
            initialRequestId === null ? undefined : initialRequestId
          }
        />
      </AuthLayout>
    </MetaData>
  );
};

export default RequestsV2;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = new SupabaseServerWrapper(context).getClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  const {
    page,
    page_size,
    sortKey,
    sortDirection,
    isCustomProperty,
    requestId,
  } = context.query;

  const currentPage = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(page_size as string, 10) || 25;

  return {
    props: {
      user: user,
      currentPage,
      query: context.query,
      pageSize,
      sort: {
        sortKey: sortKey ? (sortKey as string) : null,
        sortDirection: sortDirection ? (sortDirection as SortDirection) : null,
        isCustomProperty: isCustomProperty === "true",
      },
      initialRequestId: requestId ? (requestId as string) : null,
    },
  };
};
