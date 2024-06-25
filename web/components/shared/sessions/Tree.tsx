import { TreeNodeData } from "../../../lib/sessions/sessionTypes";
import { clsx } from "../clsx";
import { useState } from "react";

export interface TreeNodeProps {
  node: TreeNodeData;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node }) => {
  const [closeChildren, setCloseChildren] = useState(false);

  return (
    <div
      className="relative flex flex-col ml-6 before:absolute before:left-[-12px] before:top-0 before:bottom-0 before:w-[2px] before:bg-gray-300 dark:before:bg-gray-700 last:before:h-[14px]"
      key={`${node.name}-${node.label}`}
    >
      <div
        className={clsx(
          "relative flex flex-col bg-gray-200 dark:bg-gray-800 rounded-md py-2 px-3 mb-2 w-fit",
          node.children &&
            "hover:bg-gray-300 dark:hover:bg-gray-700 hover:cursor-pointer"
        )}
        onClick={() => node.children && setCloseChildren(!closeChildren)}
      >
        <div className="flex items-center">
          <div className="absolute left-[-12px] top-[14px] w-[12px] h-[2px] bg-gray-300 dark:bg-gray-700" />
          <span
            className={`font-bold mr-2 py-0.5 px-1.5 rounded text-sm ${getNodeTypeClass(
              node.name
            )}`}
          >
            {node.name}
          </span>
          <span className="text-gray-600 dark:text-gray-400 mr-2 text-sm">
            {node.duration}
          </span>
          <span className="text-green-700 dark:text-green-500 font-bold">
            {node.label}
          </span>
        </div>
        {node.properties && (
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            {Object.entries(node.properties).map(([key, value], index) => (
              <div key={index}>
                {key}: {value}
              </div>
            ))}
          </div>
        )}
      </div>
      {!closeChildren ? (
        node.children &&
        node.children.map((child, index) => (
          <TreeNode key={index} node={child} />
        ))
      ) : (
        <div
          className="flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-md py-2 px-3 mb-2 w-fit ml-10"
          onClick={() => setCloseChildren(!closeChildren)}
        >
          <span className="text-gray-600 dark:text-gray-400 text-sm">...</span>
        </div>
      )}
    </div>
  );
};

const getNodeTypeClass = (name: NodeType) => {
  switch (name) {
    case "Session":
      return "bg-purple-500 dark:bg-purple-700 text-white";
    case "Chain":
      return "bg-gray-500 dark:bg-gray-700 text-white";
    case "Tool":
      return "bg-teal-400 dark:bg-teal-600 text-white";
    case "LLM":
      return "bg-yellow-300 dark:bg-yellow-500 text-black";
    default:
      return name;
  }
};

interface TreeProps {
  data: TreeNodeData;
  className?: string;
}

export const Tree: React.FC<TreeProps> = ({ data, className }) => (
  <div
    className={clsx(
      "font-sans bg-white border dark:bg-transparent p-5 text-black dark:text-white",
      className
    )}
  >
    <TreeNode node={data} />
  </div>
);
