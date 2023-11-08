import { User } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import { NormalizedRequest } from "../components/templates/requestsV2/builder/abstractRequestBuilder";
import RequestsPageV2 from "../components/templates/requestsV2/requestsPageV2";
import { getRequests, HeliconeRequest } from "../lib/api/request/request";
import { Result } from "../lib/result";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import { FilterNode } from "../services/lib/filters/filterDefs";
import {
  SortDirection,
  SortLeafRequest,
} from "../services/lib/sorts/requests/sorts";

interface RequestsV2Props {
  user: User;
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
  initialRequestId: string | null;
}

const RequestsV2 = (props: RequestsV2Props) => {
  const { user, currentPage, pageSize, sort, initialRequestId } = props;

  return (
    <MetaData title={"Requests"}>
      <AuthLayout user={user}>
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
  const pageSize = parseInt(page_size as string, 10) || 10;

  return {
    props: {
      user: user,
      currentPage,
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
