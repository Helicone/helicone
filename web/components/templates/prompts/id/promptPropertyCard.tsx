import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { clsx } from "../../../shared/clsx";
import useNotification from "../../../shared/notification/useNotification";
import { getUSDateFromString } from "../../../shared/utils/utils";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/router";
import { Col } from "../../../layout/common";
import { Card, CardContent } from "@/components/ui/card";
import { ExpandIcon, ShrinkIcon } from "lucide-react";

interface PromptPropertyCardProps {
  isSelected: boolean;

  requestId: string;
  createdAt: string;
  properties: Record<string, string>;
  onSelect?: () => void;
  onRemove?: () => void;
  autoInputs: Record<string, any>;
  view?: "list" | "grid";
  index?: number;
  size?: "small" | "large";
}

const PromptPropertyCard = (props: PromptPropertyCardProps) => {
  const {
    isSelected,
    onSelect,
    onRemove,
    requestId,
    createdAt,
    properties,
    view = "list",
    index,
    autoInputs,
    size = "large",
  } = props;
  const { setNotification } = useNotification();
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  return (
    <>
      <Card
        className={clsx(
          isSelected
            ? "bg-sky-100 border-sky-500 dark:bg-sky-950"
            : "bg-white border-slate-300 dark:bg-black dark:border-slate-700",
          "w-full border-t px-4 py-2 "
        )}
      >
        <CardContent className="p-0 relative">
          <div className={clsx("flex flex-col w-full")}>
            <div className="flex flex-col space-y-1 items-start w-full">
              <div className="flex items-center w-full justify-between text-left">
                {onSelect ? (
                  <button onClick={onSelect}>
                    <div className="border rounded-full border-slate-500 bg-white dark:bg-black h-6 w-6 flex items-center justify-center">
                      {isSelected && index === undefined && (
                        <div className="bg-sky-500 rounded-full h-4 w-4" />
                      )}
                      {index && (
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {index}
                        </p>
                      )}
                    </div>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center space-x-2 absolute right-1 top-1">
                  <button
                    className="p-1 hover:bg-slate-100 rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(true);
                    }}
                  >
                    {expanded ? (
                      <ShrinkIcon className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ExpandIcon className="h-4 w-4 text-slate-500" />
                    )}
                  </button>
                  {onRemove && (
                    <button
                      className="p-1 hover:bg-slate-100 rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                      }}
                    >
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center w-full justify-between text-left">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(requestId);
                        setNotification("Copied to clipboard", "success");
                      }}
                      className={clsx(
                        size === "large" ? "text-md" : "text-sm",
                        "underline font-semibold text-slate-900 dark:text-slate-100 truncate"
                      )}
                    >
                      {requestId}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs z-[1001]">
                    <p>Copy</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className={"text-xs text-slate-500"}>
                {getUSDateFromString(createdAt)}
              </p>
            </div>
          </div>
          <Col>
            <label className="text-xs text-slate-500 mt-2">User Inputs</label>
            <ul className="divide-y divide-slate-300 dark:divide-slate-700 flex flex-col w-full">
              {Object.entries(properties).map(([key, value]) => (
                <li
                  key={key}
                  className="flex items-center py-2 justify-between gap-8"
                >
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                    {key}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 max-w-[22.5vw] truncate">
                    {value}
                  </p>
                </li>
              ))}
            </ul>
          </Col>
        </CardContent>
      </Card>
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-[80vw] max-h-[85vh] overflow-y-auto z-[1000]">
          <DialogHeader className="sticky -top-6 bg-white -mt-4 py-4 border-b">
            <DialogTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(requestId);
                        setNotification("Copied to clipboard", "success");
                      }}
                      className={clsx(
                        size === "large" ? "text-lg" : "text-sm",
                        "underline font-semibold text-slate-950 dark:text-slate-50 truncate"
                      )}
                    >
                      {requestId}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs z-[1001]">
                    <p>Copy</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DialogTitle>
            <p
              className={clsx(
                size === "large" ? "text-sm" : "text-xs",
                "text-slate-500"
              )}
            >
              {getUSDateFromString(createdAt)}
            </p>
            <ul className="flex flex-wrap gap-2 pt-2">
              {Object.entries(properties).map(([key, value]) => (
                <li key={key}>
                  <button
                    onClick={() => {
                      router.push(`#${key}`);
                    }}
                    className="hover:cursor-pointer"
                  >
                    <Badge variant="secondary">{key}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          </DialogHeader>

          <ul className="divide-y divide-slate-300 dark:divide-slate-700 flex flex-col w-full">
            {Object.entries(properties).map(([key, value]) => (
              <li key={key} className="flex flex-col py-4 space-y-2">
                <p className={"font-medium text-black dark:text-white"}>
                  {key}
                </p>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm">
                  {value}
                </p>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PromptPropertyCard;
