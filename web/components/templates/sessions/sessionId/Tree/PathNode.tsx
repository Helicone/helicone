import { MinusIcon, PlusIcon } from "lucide-react";
import { TreeNodeData } from "../../../../../lib/sessions/sessionTypes";

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
        "flex flex-col py-2 px-4 w-full group-hover:cursor-pointer bg-slate-50 dark:bg-black group-hover:bg-slate-100 text-slate-500 dark:text-slate-200"
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
        <div className="flex w-full gap-2 items-center">
          <div className="text-xs">{node.name}</div>
          <div className="flex items-center gap-1">
            {/* <Clock4Icon
              width={14}
              height={14}
              className="text-slate-500 dark:text-slate-200"
            /> */}
            <div className="text-[11px] text-slate-400">({node.duration})</div>
          </div>
        </div>
      </div>
    </div>
  );
}
