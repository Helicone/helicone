import {
  ArrowsPointingOutIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import { Tooltip } from "@mui/material";
import React, { memo, useState } from "react";
import { useReactFlow, useStoreApi } from "reactflow";
import { HeliconeNode } from "../../../../lib/api/graphql/client/graphql";
import { clsx } from "../../../shared/clsx";
import { Disclosure } from "@headlessui/react";

interface TreeViewProps {
  nodes: HeliconeNode[];
  filteredNodes: string[];
  setFilteredNodes: (nodes: string[]) => void;
}

const RenderNode = (props: {
  node: HeliconeNode;
  level: number;
  allNodes: HeliconeNode[];
  focusNode: (nodeId: string) => void;
  filteredNodes: string[];
  setFilteredNodes: (nodes: string[]) => void;
  childrenHidden?: boolean;
}) => {
  const {
    node: node,
    level = 0,
    allNodes: allNodes,
    focusNode,
    filteredNodes,
    setFilteredNodes,
    childrenHidden,
  } = props;
  const children = allNodes.filter((t) => t.parent_node_ids?.includes(node.id));
  const [expanded, setExpanded] = useState(true);

  return (
    <div key={node.id} className="flex flex-col space-y-2">
      <div className="flex flex-row justify-between items-center gap-2">
        <div className="flex flex-row items-center">
          <button
            onClick={() => {
              focusNode(node.id);
            }}
            className={clsx(
              `px-3 py-1.5 ${level === 0 ? "font-semibold" : ""}`,
              childrenHidden ? "opacity-50" : "",
              "hover:bg-gray-200 rounded-lg text-gray-900 text-sm text-left"
            )}
          >
            {node.name}
          </button>
          {children.length > 0 && (
            <button
              onClick={() => {
                setExpanded(!expanded);
              }}
              className="text-gray-900 px-1 py-0.5 hover:bg-gray-200 rounded-lg"
            >
              {expanded ? (
                <ChevronDownIcon className="h-4 w-4 inline-block" />
              ) : (
                <ChevronUpIcon className="h-4 w-4 inline-block" />
              )}
            </button>
          )}
        </div>

        <input
          type="checkbox"
          className={clsx(
            "ml-auto text-sky-500 rounded-sm hover:cursor-pointer",
            childrenHidden ? "opacity-50" : ""
          )}
          checked={!filteredNodes.includes(node.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setFilteredNodes(filteredNodes.filter((n) => n !== node.id));
            } else {
              setFilteredNodes([...filteredNodes, node.id]);
            }
          }}
        />
      </div>
      {expanded &&
        children.map((child) => (
          <div key={`child-${child.id}`} className="pl-4">
            <RenderNode
              node={child}
              level={level + 1}
              allNodes={allNodes}
              focusNode={focusNode}
              setFilteredNodes={setFilteredNodes}
              filteredNodes={filteredNodes}
              childrenHidden={filteredNodes.includes(node.id)}
            />
          </div>
        ))}
    </div>
  );
};

const NodeOutline: React.FC<TreeViewProps> = ({
  nodes: nodes,
  filteredNodes,
  setFilteredNodes,
}) => {
  const store = useStoreApi();
  const { setCenter, fitView } = useReactFlow();

  const focusNode = (nodeId: string) => {
    const { nodeInternals } = store.getState();
    const nodes: any[] = Array.from(nodeInternals).map(([, node]) => node);

    if (nodes.find((node) => node.id === nodeId)) {
      const node = nodes.find((node) => node.id === nodeId);

      const x = node.position.x - 100 + node.width / 2;
      const y = node.position.y + node.height / 2;
      const zoom = 0.85;

      setCenter(x, y, { zoom, duration: 700 });
    }
  };
  const rootNodes = nodes.filter((node) => node.parent_node_ids?.length === 0);

  return (
    <>
      <Disclosure>
        {({ open }) => (
          <div
            className={clsx(
              open ? "opacity-100" : "opacity-90",
              "bg-white p-2 rounded-lg shadow-lg w-80 h-full"
            )}
          >
            <Disclosure.Button className="flex w-full justify-between rounded-lg px-4 py-2 text-left text-sm font-medium text-black hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
              <span>Nodes</span>
              <ChevronUpIcon
                className={`${
                  open ? "rotate-180 transform" : ""
                } h-5 w-5 text-black`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="pl-2 pr-4 py-2 text-sm text-gray-500 flex flex-col space-y-2 h-full max-h-[80vh] overflow-auto">
              {rootNodes.map((node) => (
                <div key={`root-${node.id}`}>
                  <RenderNode
                    node={node}
                    level={0}
                    allNodes={nodes}
                    focusNode={focusNode}
                    filteredNodes={filteredNodes}
                    setFilteredNodes={setFilteredNodes}
                  />
                </div>
              ))}
            </Disclosure.Panel>
          </div>
        )}
      </Disclosure>
    </>
  );
};

export default memo(NodeOutline);
