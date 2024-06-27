import { useState } from "react";
import { TreeNodeData } from "../../../../lib/sessions/sessionTypes";
import { clsx } from "../../clsx";
import { PathNode } from "./PathNode";
import { RequestNode } from "./RequestNode";

export interface TreeNodeProps {
  node: TreeNodeData;
  selectedRequestIdDispatch: [string, (x: string) => void];
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  selectedRequestIdDispatch,
}) => {
  const [closeChildren, setCloseChildren] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = selectedRequestIdDispatch;

  return (
    <div
      className="relative flex flex-col ml-6 before:absolute before:left-[-12px] before:top-0 before:bottom-0 before:w-[2px] before:bg-[#F0F0F0] dark:before:bg-gray-700 last:before:h-[14px]"
      key={`${node.name}-${node.trace?.request_id}`}
    >
      {node.children ? (
        <PathNode
          node={node}
          setCloseChildren={setCloseChildren}
          closeChildren={closeChildren}
          setSelectedRequestId={setSelectedRequestId}
        />
      ) : (
        <RequestNode
          selectedRequestId={selectedRequestId}
          node={node}
          setCloseChildren={setCloseChildren}
          closeChildren={closeChildren}
          setSelectedRequestId={setSelectedRequestId}
        />
      )}
      {!closeChildren ? (
        node.children &&
        node.children.map((child, index) => (
          <TreeNode
            key={index}
            node={child}
            selectedRequestIdDispatch={selectedRequestIdDispatch}
          />
        ))
      ) : (
        <></>
      )}
    </div>
  );
};

interface TreeProps {
  data: TreeNodeData;
  className?: string;
  selectedRequestIdDispatch: [string, (x: string) => void];
}

export const Tree: React.FC<TreeProps> = ({
  data,
  className,
  selectedRequestIdDispatch,
}) => (
  <div
    className={clsx(
      "font-sans bg-white border dark:bg-transparent p-5 text-black dark:text-white",
      className
    )}
  >
    <TreeNode
      node={data}
      selectedRequestIdDispatch={selectedRequestIdDispatch}
    />
  </div>
);
