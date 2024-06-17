import { useRouter } from "next/router";
import AuthLayout from "../../components/layout/authLayout";
import { withAuthSSR } from "../../lib/api/handlerWrappers";
import { User } from "@supabase/auth-helpers-react";
import { ReactElement } from "react";
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

const CustomNode = ({ data }: { data: Trace }) => {
  return (
    <div
      style={{
        padding: "10px",
        border: "1px solid black",
        borderRadius: "5px",
        background: "#fff",
      }}
    >
      <div>{data.path}</div>
      {data.request_id}

      <div>
        {Object.entries(data.properties).map(([key, value], index) => {
          return (
            <>
              {key}: {value}
            </>
          );
        })}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#555" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#555" }}
      />
    </div>
  );
};
interface SessionDetailProps {
  user: User;
}

interface Trace {
  start_unix_timestamp_ms: number;
  end_unix_timestamp_ms: number;
  properties: Record<string, string>;
  path: string;
  request_id: string;
}

interface Session {
  start_time_unix_timestamp_ms: number;
  end_time_unix_timestamp_ms: number;
  session_id: string;
  session_tags: string[];
  session_cost_usd: number;
  traces: Trace[];
}

interface TraceNode {
  trace: Trace;
  children: TraceNode[];
  parents: TraceNode[];
}
const createTraceNodes = (session: Session): Record<string, TraceNode> => {
  const nodes: Record<string, TraceNode> = {};

  // Create a node for each trace
  session.traces.forEach((trace) => {
    nodes[trace.path] = {
      trace,
      children: [],
      parents: [],
    };
  });

  // Establish parent-child relationships
  session.traces.forEach((trace) => {
    const parts = trace.path.split("/");
    parts.pop(); // Remove the last part to get the parent path
    const parentPath = parts.join("/");

    if (parentPath && nodes[parentPath]) {
      nodes[trace.path].parents.push(nodes[parentPath]);
      nodes[parentPath].children.push(nodes[trace.path]);
    }
  });

  return nodes;
};

const findParents = (trace: Trace, allTraces: Trace[]) => {
  const parentTracePath = trace.path.split("/").slice(0, -1).join("/");

  return allTraces.filter((trace) => trace.path === parentTracePath);
};

const convertToFlowElements = (
  nodes: Record<string, TraceNode>,
  traces: Trace[]
) => {
  const flowNodes: Node<Trace>[] = [];
  const flowEdges: Edge<any>[] = [];

  const pathDepthCounter: Record<number, number> = {};
  traces.forEach((trace) => {
    const pathDepth = trace.path.split("/").length - 1;

    pathDepthCounter[pathDepth] = (pathDepthCounter?.[pathDepth] ?? 0) + 1;

    flowNodes.push({
      id: trace.request_id,
      data: trace,
      position: { x: pathDepth * 250, y: pathDepthCounter[pathDepth] * 100 },
      type: "customNode",
    });

    const parents = findParents(trace, traces);

    parents.forEach((parent) => {
      flowEdges.push({
        id: `${parent.request_id}-${trace.request_id}`,
        source: parent.request_id,
        target: trace.request_id,
        type: "default",
      });
    });
  });

  return {
    flowEdges,
    flowNodes,
  };
};

interface FolderNode {
  folderName: string;
  children: (FolderNode | Trace)[];
}
const tracesToFolderNodes = (traces: Trace[]): FolderNode[] => {
  const folderMap: Record<string, FolderNode> = {};

  traces.forEach((trace) => {
    if (!trace.path) {
      return;
    }
    const parts = trace.path.split("/");
    if (!parts) {
      return;
    }
    let currentFolder: FolderNode | undefined;

    parts.forEach((part, index) => {
      const currentPath = parts.slice(0, index + 1).join("/");

      if (!folderMap[currentPath]) {
        const newFolder: FolderNode = {
          folderName: part,
          children: [],
        };
        folderMap[currentPath] = newFolder;

        if (index === 0) {
          folderMap[currentPath] = newFolder;
        } else if (currentFolder) {
          currentFolder.children.push(newFolder);
        }
      }

      currentFolder = folderMap[currentPath];
    });

    if (currentFolder) {
      currentFolder.children.push(trace);
    }
  });

  const rootPaths = Object.keys(folderMap).filter(
    (path) => !path.includes("/")
  );

  return rootPaths.map((rootPath) => folderMap[rootPath]);
};

const RenderFolder = ({ traces }: { traces: Trace[] }) => {
  const folderNodes = tracesToFolderNodes(traces);
  console.log("folderNodes", folderNodes);

  return (
    <div>
      {folderNodes.map((folderNode, index) => {
        return (
          <div key={`${folderNode.folderName}-${index}`}>
            <div>{folderNode.folderName}</div>
            <div>
              {folderNode.children.map((child, index) => {
                if ("path" in child) {
                  return (
                    <div key={`${child.request_id || child.path}-${index}`}>
                      {child.request_id}
                    </div>
                  );
                } else {
                  return null;
                  // <RenderFolder
                  //   traces={child.children as Trace[]}
                  //   key={`${child.folderName}-${index}`}
                  // />
                }
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SessionDetail = ({ user }: SessionDetailProps) => {
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

  const paths = session.traces.map((trace) => trace.path);

  const spanData = session.traces.map((trace, index) => ({
    name: `Trace ${index + 1} ${trace.path}`,
    path: trace.path,
    start:
      (trace.start_unix_timestamp_ms - session.start_time_unix_timestamp_ms) /
      1000,
    duration:
      (trace.end_unix_timestamp_ms - trace.start_unix_timestamp_ms) / 1000,
  }));
  console.log(createTraceNodes(session));

  const traceNodes = createTraceNodes(session);
  const { flowEdges, flowNodes } = convertToFlowElements(
    traceNodes,
    session.traces
  );

  return (
    <div>
      <div className="w-full h-full flex flex-col space-y-8">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col items-start space-y-4 w-full">
            <HcBreadcrumb
              pages={[
                {
                  href: "/prompts",
                  name: "Prompts",
                },
                {
                  href: `/prompts/`,
                  name: "Loading...",
                },
              ]}
            />
            <div className="flex justify-between w-full">
              <div className="flex gap-4 items-end">
                <h1 className="font-semibold text-4xl text-black dark:text-white">
                  {session_id}
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

      <div>Span Visualization</div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={spanData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" />
          <Tooltip />
          <Bar
            dataKey="start"
            stackId="a"
            fill="rgba(0,0,0,0)"
            isAnimationActive={false}
          >
            {spanData.map((entry, index) => (
              <Cell key={`cell-${index}`} className="fill-transparent" />
            ))}
          </Bar>
          <Bar
            dataKey="duration"
            stackId="a"
            fill="#8884d8"
            isAnimationActive={false}
          >
            <LabelList
              dataKey="path"
              position="center"
              className="text-white z-50"
            />
            {spanData.map((entry, index) => (
              <Cell key={`cell-${index}`} className="fill-cyan-700" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div>React Flow Visualization</div>
      <div style={{ width: "100%", height: "500px" }}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={{
            customNode: CustomNode,
          }}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>

      <div>Folder Vizualization</div>
      <RenderFolder traces={session.traces} />
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
