import { useRouter } from "next/router";
import AuthLayout from "../../components/layout/authLayout";
import { withAuthSSR } from "../../lib/api/handlerWrappers";
import { User } from "@supabase/auth-helpers-react";
import { ReactElement, useState } from "react";
import Link from "next/link";
import HcBreadcrumb from "../../components/ui/hcBreadcrumb";
import HcBadge from "../../components/ui/hcBadge";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

import {
  ComposedChart,
  Bar,
  BarChart,
  YAxis,
  XAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  Line,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { clsx } from "../../components/shared/clsx";

import { Tree } from "antd";
import type { TreeDataNode, TreeProps } from "antd";
import RequestCard from "../../components/templates/requestsV2/requestCard";
import { useGetRequests } from "../../services/hooks/requests";
import getNormalizedRequest from "../../components/templates/requestsV2/builder/requestBuilder";
import { Tree as Tree2 } from "../../components/shared/sessions/Tree";
import {
  FolderNode,
  Session,
  Trace,
  TraceNode,
  TreeNodeData,
} from "../../lib/sessions/sessionTypes";
import {
  convertToFlowElements,
  createTraceNodes,
  tracesToTreeNodeData,
} from "../../lib/sessions/helpers";
import { TraceFlow } from "../../components/shared/sessions/Flow";

import { TraceSpan } from "../../components/shared/sessions/Span";

const BreadCrumb = ({ sessionId }: { sessionId: string }) => {
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
            <p className="">last used </p>
            <div className="rounded-full h-1 w-1 bg-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

const SessionDetail = ({}) => {
  const router = useRouter();
  const { session_id } = router.query;

  const session: Session = {
    start_time_unix_timestamp_ms: 1718585057000,
    end_time_unix_timestamp_ms: 1718585057000 + 1000 * 60 * 60, // 1 hour later
    session_id: "123",
    session_tags: ["tag1", "tag2"],
    session_cost_usd: 1.01,
    traces: [
      {
        start_unix_timestamp_ms: 1718585057000,
        end_unix_timestamp_ms: 1718585057000 + 60,
        properties: { model: "mistral" },
        path: "/msg0",
        request_id: "0",
      },
      {
        start_unix_timestamp_ms: 1718585057000 + 60,
        end_unix_timestamp_ms: 1718585057000 + 120,
        properties: { db: "chroma" },
        path: "/msg0/query vector db",
        request_id: "1",
      },
      {
        start_unix_timestamp_ms: 1718585057000 + 120,
        end_unix_timestamp_ms: 1718585057000 + 160,
        properties: { hyde_model: "gpt4" },
        path: "/msg0/query vector db/hyde",
        request_id: "2",
      },
      {
        start_unix_timestamp_ms: 1718585057000 + 120,
        end_unix_timestamp_ms: 1718585057000 + 160,
        properties: { hyde_model: "llama3" },
        path: "/msg0/query vector db/hyde",
        request_id: "3",
      },
      {
        start_unix_timestamp_ms: 1718585057000 + 160,
        end_unix_timestamp_ms: 1718585057000 + 600,
        properties: { model: "gpt4" },
        path: "/msg0/query vector db/hyde/enrich-question",
        request_id: "4",
      },
    ],
  };

  const selectedRequest = useGetRequests(
    1,
    1,
    "all",
    {
      created_at: "desc",
    },
    false,
    false
  );

  const [currentTopView, setCurrentTopView] = useState<"span" | "flow">("span");

  return (
    <div>
      <BreadCrumb sessionId={session_id as string} />
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
          Flow
        </button>
      </div>
      <div className="bg-white h-[em] overflow-hidden">
        {currentTopView === "span" && <TraceSpan session={session} />}
        {currentTopView === "flow" && <TraceFlow session={session} />}
      </div>
      <div className="flex">
        <Tree2
          data={tracesToTreeNodeData(session.traces)}
          className="pr-10 min-h-[1000px] w-[30em] overflow-auto"
        />
        <div>
          {selectedRequest.requests.data?.data?.[0] &&
            getNormalizedRequest(
              selectedRequest.requests.data?.data?.[0]!
            ).render()}
        </div>
      </div>
      {/* <Tree2 data={antData} /> */}
      <div className="mt-72" />
    </div>
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
