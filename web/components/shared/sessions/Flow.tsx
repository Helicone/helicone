import "reactflow/dist/style.css";

import ReactFlow, {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
} from "reactflow";
import { Session, Trace } from "../../../lib/sessions/sessionTypes";
import {
  convertToFlowElements,
  createTraceNodes,
} from "../../../lib/sessions/helpers";

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

export const TraceFlow = ({ session }: { session: Session }) => {
  const traceNodes = createTraceNodes(session);
  const { flowEdges, flowNodes } = convertToFlowElements(
    traceNodes,
    session.traces
  );
  return (
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
  );
};
