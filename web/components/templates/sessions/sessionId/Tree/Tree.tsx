import { useState } from "react";
import { TreeNodeData } from "../../../../../lib/sessions/sessionTypes";
import { clsx } from "../../../../shared/clsx";
import { PathNode } from "./PathNode";
import { RequestNode } from "./RequestNode";
interface VerticalLineProps {
  isLastChild: boolean;
}

const VerticalLine: React.FC<VerticalLineProps> = ({ isLastChild }) => {
  return (
    <div
      className={clsx(
        "absolute left-[-12px] top-[-20px] w-[2px] bg-[#F0F0F0] dark:bg-gray-700",
        !isLastChild ? "h-full " : "h-[42px] "
      )}
    />
  );
};

export const HorizontalLine: React.FC = () => {
  return (
    <div className="absolute left-[-12px] top-[20px] w-[12px] h-[2px] bg-[#F0F0F0] dark:bg-gray-700" />
  );
};

export interface TreeNodeProps {
  node: TreeNodeData;
  selectedRequestIdDispatch: [string, (x: string) => void];
  isLastChild: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  selectedRequestIdDispatch,
  isLastChild,
}) => {
  const [closeChildren, setCloseChildren] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = selectedRequestIdDispatch;

  return (
    <div
      className="relative flex flex-col ml-6"
      key={`${node.name}-${node.trace?.request_id}`}
    >
      <VerticalLine isLastChild={isLastChild} />
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
            isLastChild={
              node.children?.length
                ? index === node.children?.length - 1
                : false
            }
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
    {data.children &&
      data.children.map((child, index) => (
        <TreeNode
          key={index}
          node={child}
          selectedRequestIdDispatch={selectedRequestIdDispatch}
          isLastChild={!!data.children && index === data.children.length - 1}
        />
      ))}
  </div>
);
