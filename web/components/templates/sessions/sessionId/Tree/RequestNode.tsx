import { TreeNodeData } from "../../../../../lib/sessions/sessionTypes";
import { Row } from "../../../../layout/common/row";
import StatusBadge from "../../../requestsV2/statusBadge";
import { clsx } from "../../../../shared/clsx";
import { Clock4Icon } from "lucide-react";

export function RequestNode(props: {
  selectedRequestId: string;
  node: TreeNodeData;
  setCloseChildren: React.Dispatch<React.SetStateAction<boolean>>;
  closeChildren: boolean;
  setSelectedRequestId: (x: string) => void;
  level: number;
  setShowDrawer: (x: boolean) => void;
}) {
  console.log(props.selectedRequestId, props.node.trace?.request_id);
  const {
    selectedRequestId,
    node,
    setCloseChildren,
    closeChildren,
    setSelectedRequestId,
    level,
    setShowDrawer,
  } = props;
  return (
    <div
      className={clsx(
        " flex flex-col dark:bg-gray-800 py-[8px] pl-4 pr-[31px] group-hover:cursor-pointer w-full min-w-[456px]",
        "w-full",
        selectedRequestId === node.trace?.request_id
          ? "bg-sky-100"
          : "bg-white group-hover:bg-sky-50 dark:group-hover:bg-gray-700"
      )}
      onClick={() =>
        node.children
          ? setCloseChildren(!closeChildren)
          : setSelectedRequestId(node.trace?.request_id ?? "")
      }
    >
      <Row className="w-full justify-between items-center ">
        <Row className="items-center gap-2">
          <div className="bg-sky-200 text-sky-700 px-2 py-1 text-xs font-medium rounded-md">
            {node.trace?.request.model === "vector_db" ||
            node.trace?.request.model.startsWith("tool")
              ? node.trace?.request.model.split(":")[0]
              : node.name}
          </div>
          <div className="bg-slate-50 border border-slate-200 text-slate-700 px-2 py-1 text-xs font-medium rounded-md">
            {node.trace?.request.model}
          </div>
        </Row>
        <Row className="items-center gap-3">
          {node.trace?.request.status && (
            <StatusBadge
              statusType={node.trace?.request.status.statusType}
              errorCode={node.trace?.request.status.code}
            />
          )}
          <Row className="items-center gap-1">
            <Clock4Icon width={16} height={16} className="text-slate-500" />
            <span className="text-slate-500 text-xs">{node.duration}</span>
          </Row>
        </Row>
      </Row>
    </div>
  );
}
