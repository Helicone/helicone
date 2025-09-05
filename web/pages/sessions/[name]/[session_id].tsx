import { ReactElement, useMemo, useState, useEffect, useCallback } from "react";
import AuthLayout from "../../../components/layout/auth/authLayout";
import {
  EMPTY_SESSION_NAME,
  SessionContent,
} from "../../../components/templates/sessions/sessionId/SessionContent";
import { GetServerSidePropsContext } from "next";
import {
  convertRealtimeRequestToSteps,
  isRealtimeRequest,
} from "../../../lib/sessions/realtimeSession";
import { sessionFromHeliconeRequests } from "../../../lib/sessions/sessionsFromHeliconeTequests";
import { useGetRequests } from "../../../services/hooks/requests";
import { useRouter } from "next/router";
import { useFilterAST } from "@/filterAST/context/filterContext";
import { toFilterNode } from "@helicone-package/filters/toFilterNode";

export const SessionDetail = ({
  session_id,
  session_name,
}: {
  session_id: string;
  session_name: string;
}) => {
  const router = useRouter();

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(500);

  const ThreeMonthsAgo = useMemo(() => {
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 * 3);
  }, []);

  const filterStore = useFilterAST();

  const [isLive, setIsLive] = useState(false);

  const handlePageChange = useCallback(
    (newPage: number) => {
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, page: newPage.toString() },
        },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      setPageSize(newPageSize);
      setPage(1);
      router.push(
        {
          pathname: router.pathname,
          query: { ...router.query, page: "1" },
        },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  useEffect(() => {
    const pageFromQuery = router.query.page;
    if (pageFromQuery && !Array.isArray(pageFromQuery)) {
      const parsedPage = parseInt(pageFromQuery, 10);
      if (!isNaN(parsedPage) && parsedPage !== page) {
        setPage(parsedPage);
      }
    }
  }, [router.query.page, page]);

  const requestsHookResult = useGetRequests(
    page,
    pageSize,
    {
      left: {
        request_response_rmt: {
          properties:
            session_name !== EMPTY_SESSION_NAME
              ? {
                  "Helicone-Session-Id": {
                    equals: session_id as string,
                  },
                  "Helicone-Session-Name": {
                    equals: session_name as string,
                  },
                }
              : {
                  "Helicone-Session-Id": {
                    equals: session_id as string,
                  },
                },
        },
      },
      operator: "and",
      right: {
        left: {
          request_response_rmt: {
            request_created_at: {
              gt: ThreeMonthsAgo,
            },
          },
        },
        operator: "and",
        right: filterStore.store.filter
          ? toFilterNode(filterStore.store.filter)
          : "all",
      },
    },
    {
      created_at: "asc",
    },
    false,
    isLive,
  );

  // Process requests: Check for realtime session and convert if necessary
  const processedRequests = useMemo(() => {
    const rawRequests = requestsHookResult.requests.requests ?? [];

    // Iterate through all requests. If a request is realtime, convert it to steps.
    // Otherwise, keep the original request. Flatten the result.
    return rawRequests.flatMap((request) => {
      if (isRealtimeRequest(request)) {
        return convertRealtimeRequestToSteps(request);
      } else {
        return [request]; // Keep non-realtime requests as a single-element array for flatMap
      }
    });
  }, [requestsHookResult.requests.requests]);

  const session = sessionFromHeliconeRequests(processedRequests);

  return (
    <SessionContent
      session={session}
      session_id={session_id}
      session_name={session_name}
      requests={requestsHookResult}
      isLive={isLive}
      setIsLive={setIsLive}
      currentPage={page}
      pageSize={pageSize}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
    />
  );
};

SessionDetail.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default SessionDetail;

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  const { session_id, name: session_name } = context.query;

  const decodedSessionId =
    typeof session_id === "string"
      ? decodeURIComponent(session_id)
      : session_id;

  const decodedSessionName =
    typeof session_name === "string"
      ? decodeURIComponent(session_name)
      : session_name;

  return {
    props: {
      session_id: decodedSessionId,
      session_name: decodedSessionName,
    },
  };
};
