import dagre from "dagre";
import { memo, useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Edge,
  MiniMap,
  Node,
  Position,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
} from "reactflow";

import "reactflow/dist/style.css";
import { HeliconeNode } from "../../../../lib/api/graphql/client/graphql";
import JobNode from "./JobNode";
import NodeDirectory from "./nodeDirectory";

const nodeTypes = {
  custom: JobNode,
};

const nodeWidth = 1000;
const nodeHeight = 600;

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (
  nodes: JobNode[],
  edges: Edge[],
  direction = "LR"
): {
  nodes: Node[];
  edges: Edge[];
} => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  edges = edges.map((edge) => {
    return {
      ...edge,
      type: "smoothstep",
      animated: true,
    };
  });

  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2 + Math.random() / 1000,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
        targetPosition: isHorizontal ? Position.Left : Position.Top,
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        type: "custom",
      };
    }),
    edges,
  };
};

export interface JobNode {
  id: string;
  data: {
    node: HeliconeNode;
  };
  parentIds: string[];
}

export interface FlowProps {
  jobNodes: JobNode[];
}

function checkAnyParentsAreFiltered(
  parent: JobNode,
  filteredNodes: string[],
  allNodes: JobNode[]
): boolean {
  if (filteredNodes.includes(parent.id)) {
    return true;
  }
  // return false;
  if (parent.parentIds.length === 0) {
    return false;
  }
  const firstParentNode = allNodes.find((node) =>
    parent.parentIds.includes(node.id)
  );
  if (firstParentNode === undefined) {
    return false;
  }
  return checkAnyParentsAreFiltered(firstParentNode, filteredNodes, allNodes);
}

function Flow(props: FlowProps) {
  const { jobNodes: jobNodes } = props;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [filteredNodes, setFilteredNodes] = useState<string[]>([]);

  useEffect(() => {
    const tempNodes = jobNodes.filter((node) => {
      const hasFilteredParent = checkAnyParentsAreFiltered(
        node,
        filteredNodes,
        jobNodes
      );
      return !filteredNodes.includes(node.id) && !hasFilteredParent;
    });
    const edges = tempNodes.flatMap((node) => {
      return node.parentIds.map((parentId) => {
        return {
          id: `e${node.id}-${parentId} `,
          source: parentId,
          target: node.id,
        };
      });
    });
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      tempNodes,
      edges
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [jobNodes, setNodes, setEdges, filteredNodes]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <>
      <div className="w-full h-[85vh]">
        <ReactFlowProvider>
          <NodeDirectory
            nodes={jobNodes.map((node) => node.data.node)}
            filteredNodes={filteredNodes}
            setFilteredNodes={setFilteredNodes}
          />

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            panOnScroll
          >
            <MiniMap />
            <Background color="#f4f4f4" variant={BackgroundVariant.Lines} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </>
  );
}

export default memo(Flow);
