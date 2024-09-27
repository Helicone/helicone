import { MinusSquareIcon, PlusSquareIcon } from "lucide-react";
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
        "flex flex-col py-2 px-4 w-full group-hover:cursor-pointer bg-slate-50 group-hover:bg-slate-100 text-slate-700"
      }
      // style={{
      //   paddingLeft: (level + 1) * 16 + 8,
      // }}
      onClick={() =>
        node.children
          ? setCloseChildren(!closeChildren)
          : setSelectedRequestId(node.trace?.request_id ?? "")
      }
    >
      <div className="flex items-center gap-2">
        {!closeChildren ? (
          <MinusSquareIcon width={16} height={16} className="text-slate-700" />
        ) : (
          <PlusSquareIcon width={16} height={16} className="text-slate-700" />
        )}

        <div className="flex w-full justify-between items-center">
          <div className="font-semibold text-sm">{node.name}</div>
          <div className="font-semibold text-xs">{node.duration}</div>
        </div>
      </div>
    </div>
  );
}
