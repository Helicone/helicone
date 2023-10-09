import React, { useCallback, useState, useEffect, memo } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Position,
  Node,
  Edge,
  BackgroundVariant,
  ReactFlowProvider,
} from "reactflow";
import dagre from "dagre";

import "reactflow/dist/style.css";
import TaskNode from "./TaskNode";
import { HeliconeNode } from "../../../../lib/api/graphql/client/graphql";
import { useGetRequests } from "../../../../services/hooks/requests";
import FlowButton from "./buttons";
import TaskDirectory from "./taskDirectory";
import RequestDrawerV2 from "../../requestsV2/requestDrawerV2";
import useRequestsPageV2 from "../../requestsV2/useRequestsPageV2";

const nodeTypes = {
  custom: TaskNode,
};

const nodeWidth = 1000;
const nodeHeight = 600;

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (
  nodes: TaskNode[],
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

export interface TaskNode {
  id: string;
  data: {
    task: HeliconeNode;
  };
  parentId?: string;
}

export interface FlowProps {
  taskNodes: TaskNode[];
}

function checkAnyParentsAreFiltered(
  parent: TaskNode,
  filteredNodes: string[],
  allTasks: TaskNode[]
): boolean {
  if (filteredNodes.includes(parent.id)) {
    return true;
  }
  if (parent.parentId === undefined) {
    return false;
  }
  const parentTask = allTasks.find((task) => task.id === parent.parentId);
  if (parentTask === undefined) {
    return false;
  }
  return checkAnyParentsAreFiltered(parentTask, filteredNodes, allTasks);
}

function Flow(props: FlowProps) {
  const { taskNodes } = props;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [filteredNodes, setFilteredNodes] = useState<string[]>([]);

  // useEffect(() => {
  //   const tempNodes = taskNodes.filter((task) => {
  //     const hasFilteredParent = checkAnyParentsAreFiltered(
  //       task,
  //       filteredNodes,
  //       taskNodes
  //     );
  //     return !filteredNodes.includes(task.id) && !hasFilteredParent;
  //   });
  //   const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
  //     tempNodes,
  //     tempNodes
  //       .filter((task) => task.parentId !== undefined)
  //       .map((task) => {
  //         return {
  //           id: `e${task.id}-${task.parentId} `,
  //           source: task.parentId!,
  //           target: task.id!,
  //         };
  //       })
  //   );
  //   setNodes(layoutedNodes);
  //   setEdges(layoutedEdges);
  // }, [taskNodes, setNodes, setEdges, filteredNodes]);

  // const onConnect = useCallback(
  //   (params: any) => setEdges((eds) => addEdge(params, eds)),
  //   [setEdges]
  // );

  return (
    <>
      <div className="w-full h-[55vh] ">
        <ReactFlowProvider>
          <TaskDirectory
            tasks={taskNodes.map((task) => task.data.task)}
            filteredNodes={filteredNodes}
            setFilteredNodes={setFilteredNodes}
          />

          {/* <ReactFlow
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
          </ReactFlow> */}
        </ReactFlowProvider>
      </div>
    </>
  );
}

export default memo(Flow);
