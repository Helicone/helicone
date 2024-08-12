import { TreeNodeData } from "../../../../../lib/sessions/sessionTypes";
import { clsx } from "../../../../shared/clsx";

function MinusSign() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="16" height="16" rx="2" fill="white" />
      <path
        d="M12.6667 12.6667V3.33333H3.33333V12.6667H12.6667ZM12.6667 2C13.0203 2 13.3594 2.14048 13.6095 2.39052C13.8595 2.64057 14 2.97971 14 3.33333V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.59333 2.6 2 3.33333 2H12.6667ZM11.3333 7.33333V8.66667H4.66667V7.33333H11.3333Z"
        fill="#3C82F6"
      />
    </svg>
  );
}

function PlusSign() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.6667 10.6667V1.33333H1.33333V10.6667H10.6667ZM10.6667 0C11.0203 0 11.3594 0.140476 11.6095 0.390524C11.8595 0.640573 12 0.979711 12 1.33333V10.6667C12 11.0203 11.8595 11.3594 11.6095 11.6095C11.3594 11.8595 11.0203 12 10.6667 12H1.33333C0.979711 12 0.640573 11.8595 0.390524 11.6095C0.140476 11.3594 0 11.0203 0 10.6667V1.33333C0 0.593333 0.6 0 1.33333 0H10.6667ZM5.33333 2.66667H6.66667V5.33333H9.33333V6.66667H6.66667V9.33333H5.33333V6.66667H2.66667V5.33333H5.33333V2.66667Z"
        fill="#3C82F6"
      />
    </svg>
  );
}

export function PathNode(props: {
  node: TreeNodeData;
  setCloseChildren: React.Dispatch<React.SetStateAction<boolean>>;
  closeChildren: boolean;
  setSelectedRequestId: (x: string) => void;
}) {
  const { node, setCloseChildren, closeChildren, setSelectedRequestId } = props;
  return (
    <div
      className={clsx(
        "relative flex flex-col rounded-md py-2 px-[6px] mb-2 w-fit",

        "hover:bg-[#F0F0F0] dark:hover:bg-gray-700 hover:cursor-pointer"
      )}
      onClick={() =>
        node.children
          ? setCloseChildren(!closeChildren)
          : setSelectedRequestId(node.trace?.request_id ?? "")
      }
    >
      <div className="absolute left-[-12px] top-[20px] w-[18px] h-[2px] bg-[#F0F0F0] dark:bg-gray-700" />
      <div className="flex items-center gap-2">
        {!closeChildren ? <MinusSign /> : <PlusSign />}

        <div className="font-bold">{node.name}</div>
        <div className="font-thin text-xs">{node.duration}</div>
      </div>
    </div>
  );
}
