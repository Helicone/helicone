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
import { useRunPage } from "../useRunPage";
import {
  HeliconeJob,
  HeliconeNode,
} from "../../../../lib/api/graphql/client/graphql";
import { ThemedSwitch } from "../../../shared/themed/themedSwitch";
import { useSingleRunPage } from "../useSingleRunPage";
import Flow from "./flow";
import { useReactFlow, useStoreApi } from "reactflow";
import { Tooltip } from "@mui/material";

interface TreeViewProps {
  tasks: HeliconeNode[];
  filteredNodes: string[];
  setFilteredNodes: (nodes: string[]) => void;
}

const RenderTask = (props: {
  task: HeliconeNode;
  level: number;
  allTasks: HeliconeNode[];
  focusNode: (nodeId: string) => void;
  filteredNodes: string[];
  setFilteredNodes: (nodes: string[]) => void;
  childrenHidden?: boolean;
}) => {
  const { fitView } = useReactFlow();
  const {
    task,
    level = 0,
    allTasks,
    focusNode,
    filteredNodes,
    setFilteredNodes,
    childrenHidden,
  } = props;
  const children = allTasks.filter((t) => t.parent_id === task.id);
  const [expanded, setExpanded] = useState(true);

  return (
    <div key={task.id} className="pl-4">
      <div className="flex flex-row justify-start">
        {children.length > 0 && (
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
        )}
        <button
          onClick={() => {
            focusNode(task.id);
          }}
          className={clsx(
            `py-2 px-2 ${level === 0 ? "font-bold" : ""}`,
            childrenHidden ? "opacity-50" : "",
            "hover:bg-gray-200 rounded-md "
          )}
        >
          {task.name}
        </button>
        <input
          type="checkbox"
          className={clsx("ml-auto ", childrenHidden ? "opacity-50" : "")}
          checked={!filteredNodes.includes(task.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setFilteredNodes(
                filteredNodes.filter((node) => node !== task.id)
              );
            } else {
              setFilteredNodes([...filteredNodes, task.id]);
            }
          }}
        />
      </div>
      {expanded &&
        children.map((child) => (
          <div key={`child-${child.id}`} className="pl-4">
            <RenderTask
              task={child}
              level={level + 1}
              allTasks={allTasks}
              focusNode={focusNode}
              setFilteredNodes={setFilteredNodes}
              filteredNodes={filteredNodes}
              childrenHidden={filteredNodes.includes(task.id)}
            />
          </div>
        ))}
    </div>
  );
};

const TaskDirectory: React.FC<TreeViewProps> = ({
  tasks,
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
  const rootTasks = tasks.filter((task) => !task.parent_id);

  return (
    <div className="bg-white p-4 rounded shadow">
      {rootTasks.map((task) => (
        <div key={`root-${task.id}`} className="pl-4 max-w-3xl">
          <RenderTask
            task={task}
            level={0}
            allTasks={tasks}
            focusNode={focusNode}
            filteredNodes={filteredNodes}
            setFilteredNodes={setFilteredNodes}
          />
        </div>
      ))}
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

export default memo(TaskDirectory);
