import { MinusIcon, PlusIcon } from "lucide-react";

export function PathNode(props: {
  name: string;
  count: number;
  onClose: () => void;
  isClosed: boolean;
}) {
  const { name, count, onClose, isClosed } = props;
  return (
    <div
      className={
        "flex flex-col py-2 px-4 w-full cursor-pointer bg-slate-50 dark:bg-black hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-200"
      }
      onClick={onClose}
    >
      <div className="flex items-center gap-2">
        {!isClosed ? (
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
          <div className="text-xs">{name}</div>
          <div className="flex items-center gap-1">
            <div className="text-[11px] text-slate-400">({count})</div>
          </div>
        </div>
      </div>
    </div>
  );
}
