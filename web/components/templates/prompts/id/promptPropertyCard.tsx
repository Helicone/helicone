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
    view: _view = "list",
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
            ? "border-sky-500 bg-sky-100 dark:bg-sky-950"
            : "border-slate-300 bg-white dark:border-slate-700 dark:bg-black",
          "w-full border-t px-4 py-2",
        )}
      >
        <CardContent className="relative p-0">
          <div className={clsx("flex w-full flex-col")}>
            <div className="flex w-full flex-col items-start space-y-1">
              <div className="flex w-full items-center justify-between text-left">
                {onSelect ? (
                  <button onClick={onSelect}>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-500 bg-white dark:bg-black">
                      {isSelected && index === undefined && (
                        <div className="h-4 w-4 rounded-full bg-sky-500" />
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
                <div className="absolute right-1 top-1 flex items-center space-x-2">
                  <button
                    className="rounded-lg p-1 hover:bg-slate-100"
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
                      className="rounded-lg p-1 hover:bg-slate-100"
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
              <div className="flex w-full items-center justify-between text-left">
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
                        "truncate font-semibold text-slate-900 underline dark:text-slate-100",
                      )}
                    >
                      {requestId}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="z-[1001] text-xs">
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
            <label className="mt-2 text-xs text-slate-500">User Inputs</label>
            <ul className="flex w-full flex-col divide-y divide-slate-300 dark:divide-slate-700">
              {Object.entries(properties).map(([key, value]) => (
                <li
                  key={key}
                  className="flex items-center justify-between gap-8 py-2"
                >
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {key}
                  </p>
                  <p className="max-w-[22.5vw] truncate text-xs text-slate-700 dark:text-slate-300">
                    {JSON.stringify(value).slice(0, 100)}
                  </p>
                </li>
              ))}
            </ul>
            <ul className="flex flex-wrap gap-2 pt-2">
              {Object.entries(autoInputs).map(([key, value]) => (
                <li
                  key={key}
                  className="flex items-center justify-between gap-8 py-2"
                >
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {key}
                  </p>
                  <p className="max-w-[22.5vw] truncate text-xs text-slate-700 dark:text-slate-300">
                    {JSON.stringify(value).slice(0, 100)}
                  </p>
                </li>
              ))}
            </ul>
          </Col>
        </CardContent>
      </Card>
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="z-[1000] max-h-[85vh] max-w-[80vw] overflow-y-auto">
          <DialogHeader className="sticky -top-6 -mt-4 border-b bg-white py-4">
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
                        "truncate font-semibold text-slate-950 underline dark:text-slate-50",
                      )}
                    >
                      {requestId}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="z-[1001] text-xs">
                    <p>Copy</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DialogTitle>
            <p
              className={clsx(
                size === "large" ? "text-sm" : "text-xs",
                "text-slate-500",
              )}
            >
              {getUSDateFromString(createdAt)}
            </p>
            <ul className="flex flex-wrap gap-2 pt-2">
              {Object.entries(properties).map(([key]) => (
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

          <ul className="flex w-full flex-col divide-y divide-slate-300 dark:divide-slate-700">
            {Object.entries(properties).map(([key, value]) => (
              <li key={key} className="flex flex-col space-y-2 py-4">
                <p className={"font-medium text-black dark:text-white"}>
                  {key}
                </p>
                <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
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
