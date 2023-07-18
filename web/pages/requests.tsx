import { User } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import { NormalizedRequest } from "../components/templates/requestsV2/builder/abstractRequestBuilder";
import getRequestBuilder from "../components/templates/requestsV2/builder/requestBuilder";
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
  initialRequest: HeliconeRequest | null;
}

const RequestsV2 = (props: RequestsV2Props) => {
  const { user, currentPage, pageSize, sort, initialRequest } = props;

  return (
    <MetaData title={"Requests"}>
      <AuthLayout user={user}>
        <RequestsPageV2
          currentPage={currentPage}
          pageSize={pageSize}
          sort={sort}
          initialRequest={initialRequest === null ? undefined : initialRequest}
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
  let initialRequest: HeliconeRequest | null = null;
  // if (requestId) {
  //   const { data, error } = await getRequests(
  //     "69c2783c-c523-4522-b3d1-ff2696343609",
  //     {
  //       left: {
  //         request: {
  //           id: {
  //             equals: requestId,
  //           },
  //         },
  //       },
  //       operator: "and",
  //       right: "all",
  //     } as FilterNode,
  //     0,
  //     1,
  //     {}
  //   );
  //   if (data && data.length > 0) {
  //     initialRequest = data[0];
  //     if (initialRequest.response_created_at) {
  //       initialRequest.response_created_at =
  //         initialRequest.response_created_at.toString();
  //     }
  //     if (initialRequest.request_created_at) {
  //       initialRequest.request_created_at =
  //         initialRequest.request_created_at.toString();
  //     }
  //   }
  // }

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
      initialRequest: initialRequest,
    },
  };
};
