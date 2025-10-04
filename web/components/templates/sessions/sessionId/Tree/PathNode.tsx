import { MinusIcon, PlusIcon } from "lucide-react";
import { TreeNodeData } from "../../../../../lib/sessions/sessionTypes";
import React from "react";

export function PathNode(props: {
  node: TreeNodeData;
  setCloseChildren: React.Dispatch<React.SetStateAction<boolean>>;
  closeChildren: boolean;
  setSelectedRequestId: (x: string) => void;
  level: number;
}) {
  const { node, setCloseChildren, closeChildren, setSelectedRequestId, level } =
    props;
  return (
    <div
      className={
        "flex w-full flex-col bg-slate-50 px-4 py-2 text-slate-500 group-hover:cursor-pointer group-hover:bg-slate-100 dark:bg-black dark:text-slate-200 dark:group-hover:bg-slate-900"
      }
      onClick={() =>
        node.children
          ? setCloseChildren(!closeChildren)
          : setSelectedRequestId(node.trace?.request_id ?? "")
      }
    >
      <div className="flex items-center gap-2">
        {!closeChildren ? (
          <MinusIcon
            width={14}
            height={14}
            className="text-slate-400 dark:text-slate-200"
          />
        ) : (
          <PlusIcon
            width={14}
            height={14}
            className="text-slate-400 dark:text-slate-200"
          />
        )}
        <div className="flex w-full items-center gap-2">
          <div className="text-xs">{node.subPathName}</div>
          <div className="flex items-center gap-1">
            {/* <Clock4Icon
              width={14}
              height={14}
              className="text-slate-500 dark:text-slate-200"
            /> */}
            <div className="text-[11px] text-slate-400">({node.latency})</div>
          </div>
        </div>
      </div>
    </div>
  );
}
