import React, { memo, useEffect, useRef, useState } from "react";
import ThemedTableV5 from "../../../shared/themed/table/themedTableV5";
import AuthHeader from "../../../shared/authHeader";
import useRequestsPageV2 from "../../requestsV2/useRequestsPageV2";
import { NormalizedRequest } from "../../requestsV2/builder/abstractRequestBuilder";
import RequestDrawerV2 from "../../requestsV2/requestDrawerV2";
import TableFooter from "../../requestsV2/tableFooter";
import {
  SortDirection,
  SortLeafRequest,
} from "../../../../services/lib/sorts/requests/sorts";
import { FilterNode } from "../../../../services/lib/filters/filterDefs";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../../lib/timeCalculations/time";
import { getInitialColumns } from "../initialColumns";
import { useDebounce } from "../../../../services/hooks/debounce";
import { UIFilterRow } from "../../../shared/themed/themedAdvancedFilters";
import {
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "../../../shared/clsx";
import { useRouter } from "next/router";
import { HeliconeRequest } from "../../../../lib/api/request/request";
import getRequestBuilder from "../../requestsV2/builder/requestBuilder";
import { Result } from "../../../../lib/result";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import useNotification from "../../../shared/notification/useNotification";
import { Switch } from "@headlessui/react";
import { BoltIcon, BoltSlashIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { RequestView } from "../../requestsV2/RequestView";
import { useJobPage } from "../useJobPage";
import {
  HeliconeJob,
  HeliconeNode,
} from "../../../../lib/api/graphql/client/graphql";
import { ThemedSwitch } from "../../../shared/themed/themedSwitch";
import { useSingleJobPage } from "../useSingleJobPage";
import Flow from "./flow";
import { useReactFlow, useStoreApi } from "reactflow";
import { Tooltip } from "@mui/material";

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
  const { fitView } = useReactFlow();
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
    <div key={node.id} className="pl-4">
      <div className="flex flex-row justify-start">
        {children.length > 0 ? (
          <button
            onClick={() => {
              setExpanded(!expanded);
            }}
            className="pr-2"
          >
            {expanded ? (
              <ChevronDownIcon className="h-4 w-4 inline-block" />
            ) : (
              <ChevronUpIcon className="h-4 w-4 inline-block" />
            )}
          </button>
        ) : (
          <div className="pl-6" />
        )}
        <button
          onClick={() => {
            focusNode(node.id);
          }}
          className={clsx(
            `py-2 px-2 ${level === 0 ? "font-bold" : ""}`,
            childrenHidden ? "opacity-50" : "",
            "hover:bg-gray-200 rounded-md "
          )}
        >
          {node.name}
        </button>
        <input
          type="checkbox"
          className={clsx("ml-auto ", childrenHidden ? "opacity-50" : "")}
          checked={!filteredNodes.includes(node.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setFilteredNodes(
                filteredNodes.filter((node) => node !== node.id)
              );
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

const NodeDirectory: React.FC<TreeViewProps> = ({
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

      const x = node.position.x + node.width / 2;
      const y = node.position.y + node.height / 2;
      const zoom = 1.85;

      setCenter(x, y, { zoom, duration: 1000 });
    }
  };
  const rootNodes = nodes.filter((node) => node.parent_node_ids?.length === 0);

  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex flex-row justify-start">
        <button
          onClick={() => {
            setExpanded(!expanded);
          }}
          className="pr-2"
        >
          {expanded ? (
            <ChevronDownIcon className="h-4 w-4 inline-block" />
          ) : (
            <ChevronUpIcon className="h-4 w-4 inline-block" />
          )}
        </button>
        <p className="font-bold">Nodes</p>
      </div>
      <div className="flex flex-col justify-start">
        {expanded &&
          rootNodes.map((node) => (
            <div key={`root-${node.id}`} className="pl-4 max-w-3xl">
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
      </div>
      <div className="flex flex-row w-full justify-end">
        <Tooltip title={"Fit View"}>
          <button
            onClick={() => {
              fitView();
            }}
            className="hover:bg-gray-200 rounded-md -m-1 p-1"
          >
            <ArrowsPointingOutIcon className="h-5 w-5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default memo(NodeDirectory);
