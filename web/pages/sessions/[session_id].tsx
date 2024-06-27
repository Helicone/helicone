import { useRouter } from "next/router";
import { ReactElement, useState } from "react";
import "reactflow/dist/style.css";
import AuthLayout from "../../components/layout/authLayout";
import HcBreadcrumb from "../../components/ui/hcBreadcrumb";
import { withAuthSSR } from "../../lib/api/handlerWrappers";

import { clsx } from "../../components/shared/clsx";

import { TraceFlow } from "../../components/shared/sessions/Flow";
import { Tree } from "../../components/shared/sessions/Tree/Tree";
import getNormalizedRequest from "../../components/templates/requestsV2/builder/requestBuilder";
import { tracesToTreeNodeData } from "../../lib/sessions/helpers";
import { Session, Trace } from "../../lib/sessions/sessionTypes";
import { useGetRequests } from "../../services/hooks/requests";

import { TraceSpan } from "../../components/shared/sessions/Span";
import { HeliconeRequest } from "../../lib/api/request/request";
import { Row } from "../../components/layout/common/row";
import { Col } from "../../components/layout/common/col";
import { getTimeAgo } from "../../lib/sql/timeHelpers";

const BreadCrumb = ({
  sessionId,
  startTime,
  endTime,
}: {
  sessionId: string;
  startTime: Date;
  endTime: Date;
}) => {
  return (
    <div className="w-full h-full flex flex-col space-y-8">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col items-start space-y-4 w-full">
          <HcBreadcrumb
            pages={[
              {
                href: "/sessions",
                name: "Sessions",
              },
              {
                href: `/sessions/${sessionId}`,
                name: sessionId,
              },
            ]}
          />
          <div className="flex justify-between w-full">
            <div className="flex gap-4 items-end">
              <h1 className="font-semibold text-4xl text-black dark:text-white">
                {sessionId}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <p className="">last used {getTimeAgo(endTime)}</p>

            <div className="rounded-full h-1 w-1 bg-slate-400" />
            <p className="">created on {startTime.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function sessionFromHeliconeRequests(requests: HeliconeRequest[]): Session {
  if (requests.length === 0) {
    return {
      start_time_unix_timestamp_ms: 0,
      end_time_unix_timestamp_ms: 0,
      session_id: "0",
      session_tags: [],
      session_cost_usd: 0,
      traces: [],
    };
  }

  const firstRequest = requests[requests.length - 1];
  const lastRequest = requests[0];

  return {
    start_time_unix_timestamp_ms: new Date(
      firstRequest.request_created_at
    ).getTime(),
    end_time_unix_timestamp_ms: new Date(
      lastRequest.response_created_at
    ).getTime(),
    session_id: firstRequest.request_properties?.[
      "Helicone-Session-Id"
    ] as string,
    session_tags: [],
    session_cost_usd: 0,
    traces: requests
      .map((request) => {
        const x: Trace = {
          start_unix_timestamp_ms: new Date(
            request.request_created_at
          ).getTime(),
          end_unix_timestamp_ms: new Date(
            request.response_created_at
          ).getTime(),
          properties: Object.entries(request.request_properties ?? {})
            .filter(([key]) => key.startsWith("Helicone-") === false)
            .reduce((acc, [key, value]) => {
              acc[key] = value as string;
              return acc;
            }, {} as Record<string, string>),
          path:
            (request.request_properties?.["Helicone-Session-Path"] as string) ??
            "/",
          request_id: request.request_id,
          request: getNormalizedRequest(request),
        };
        return x;
      })
      .sort((a, b) => a.start_unix_timestamp_ms - b.start_unix_timestamp_ms),
  };
}

const SessionDetail = ({}) => {
  const router = useRouter();
  const { session_id } = router.query;
  const requests = useGetRequests(
    1,
    100,
    {
      properties: {
        "Helicone-Session-Id": {
          equals: session_id as string,
        },
      },
    },
    {
      created_at: "desc",
    },
    false,
    false
  );

  const session = sessionFromHeliconeRequests(
    requests.requests.data?.data ?? []
  );

  const [selectedRequestId, setSelectedRequestId] = useState<string>("");

  const requestIdToShow =
    selectedRequestId ?? session.traces?.[0]?.request_id ?? null;

  const [currentTopView, setCurrentTopView] = useState<
    "span" | "flow" | "hidden"
  >("span");

  return (
    <Col className="gap-[12px]">
      <BreadCrumb
        sessionId={session_id as string}
        startTime={
          requests.requests.data?.data
            ? new Date(
                requests.requests.data?.data[
                  requests.requests.data?.data.length - 1
                ].request_created_at
              )
            : new Date()
        }
        endTime={
          requests.requests.data?.data
            ? new Date(requests.requests.data?.data[0].request_created_at)
            : new Date()
        }
      />
      <div>
        <button
          onClick={() => setCurrentTopView("span")}
          className={clsx(
            "px-4 py-2 rounded-md",
            currentTopView === "span"
              ? "bg-gray-200 dark:bg-gray-800"
              : "bg-gray-100 dark:bg-gray-900"
          )}
        >
          Span
        </button>
        <button
          onClick={() => setCurrentTopView("flow")}
          className={clsx(
            "px-4 py-2 rounded-md",
            currentTopView === "flow"
              ? "bg-gray-200 dark:bg-gray-800"
              : "bg-gray-100 dark:bg-gray-900"
          )}
        >
          Flow (experimental)
        </button>
        <button
          onClick={() => setCurrentTopView("hidden")}
          className={clsx(
            "px-4 py-2 rounded-md",
            currentTopView === "hidden"
              ? "bg-gray-200 dark:bg-gray-800"
              : "bg-gray-100 dark:bg-gray-900"
          )}
        >
          Hidden
        </button>
      </div>
      <div className="bg-white">
        {currentTopView === "span" && (
          <TraceSpan
            session={session}
            selectedRequestIdDispatch={[
              selectedRequestId,
              setSelectedRequestId,
            ]}
          />
        )}
        {currentTopView === "flow" && <TraceFlow session={session} />}
      </div>
      <Row className={"gap-[12px]"}>
        <Tree
          data={tracesToTreeNodeData(session.traces)}
          className="pr-10 min-h-[1000px] w-[30em] overflow-auto min-w-[30em] rounded-lg max-h-screen overflow-auto"
          selectedRequestIdDispatch={[selectedRequestId, setSelectedRequestId]}
        />
        <div className="flex-grow">
          {requestIdToShow &&
            requests.requests.data?.data?.find(
              (r) => r.request_id === requestIdToShow
            ) &&
            getNormalizedRequest(
              requests.requests.data?.data?.find(
                (r) => r.request_id === requestIdToShow
              )!
            ).render()}
        </div>
      </Row>

      <div className="mt-72" />
    </Col>
  );
};

SessionDetail.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default SessionDetail;

export const getServerSideProps = withAuthSSR(async (options) => {
  return {
    props: {
      user: options.userData.user,
    },
  };
});
