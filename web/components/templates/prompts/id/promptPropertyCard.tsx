import { Tooltip } from "@mui/material";
import { clsx } from "../../../shared/clsx";
import useNotification from "../../../shared/notification/useNotification";
import { getUSDateFromString } from "../../../shared/utils/utils";
import { ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import ThemedModal from "../../../shared/themed/themedModal";
import { Badge } from "@tremor/react";

interface PromptPropertyCardProps {
  isSelected: boolean;
  onSelect: () => void;
  requestId: string;
  createdAt: string;
  properties: Record<string, string>;
  view?: "list" | "grid";
  index?: number;
  size?: "small" | "large";
}

const PromptPropertyCard = (props: PromptPropertyCardProps) => {
  const {
    isSelected,
    onSelect,
    requestId,
    createdAt,
    properties,
    view = "list",
    index,
    size = "large",
  } = props;
  const { setNotification } = useNotification();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div
        className={clsx(
          isSelected
            ? "bg-sky-100 border-sky-500 dark:bg-sky-950"
            : "bg-white border-gray-300 dark:bg-black dark:border-gray-700",
          "w-full border p-4 rounded-lg"
        )}
      >
        <button className={clsx("flex flex-col w-full")} onClick={onSelect}>
          <div className="flex flex-col space-y-1 items-start w-full">
            <div className="flex items-center w-full justify-between text-left">
              <div className="border rounded-full border-gray-500 bg-white dark:bg-black h-6 w-6 flex items-center justify-center">
                {isSelected && index === undefined && (
                  <div className="bg-sky-500 rounded-full h-4 w-4" />
                )}
                {index && (
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    {index}
                  </p>
                )}
              </div>
              <button
                className="p-1 hover:bg-gray-100 rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(true);
                }}
              >
                <ArrowsPointingOutIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center w-full justify-between text-left">
              <Tooltip title="Copy">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(requestId);
                    setNotification("Copied to clipboard", "success");
                  }}
                  className={clsx(
                    size === "large" ? "text-lg" : "text-sm",
                    "underline font-semibold text-black dark:text-white truncate"
                  )}
                >
                  {requestId}
                </button>
              </Tooltip>
            </div>
            <p
              className={clsx(
                size === "large" ? "text-sm" : "text-xs",
                "text-gray-500"
              )}
            >
              {getUSDateFromString(createdAt)}
            </p>
          </div>
        </button>
        <ul className="divide-y divide-gray-300 dark:divide-gray-700 flex flex-col mt-4 w-full">
          {Object.entries(properties).map(([key, value]) => (
            <li
              key={key}
              className="flex items-center py-2 justify-between gap-8"
            >
              <p
                className={clsx(
                  size === "large" ? "text-sm" : "text-xs",
                  "font-semibold text-black dark:text-white"
                )}
              >
                {key}
              </p>
              <p
                className={clsx(
                  size === "large" ? "text-sm" : "text-xs",
                  "text-sm text-gray-700 dark:text-gray-300 max-w-[22.5vw] truncate"
                )}
              >
                {value} fsdlkfjdslk jfj sdlkfdsj jfdslkf jsdkljf jlfkdjflksf
                lksdjf
              </p>
            </li>
          ))}
        </ul>
      </div>
      <ThemedModal open={expanded} setOpen={setExpanded}>
        <div className="w-[80vw] h-full flex flex-col items-start">
          <Tooltip title="Copy">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(requestId);
                setNotification("Copied to clipboard", "success");
              }}
              className={clsx(
                size === "large" ? "text-lg" : "text-sm",
                "underline font-semibold text-black dark:text-white truncate"
              )}
            >
              {requestId}
            </button>
          </Tooltip>
          <p
            className={clsx(
              size === "large" ? "text-sm" : "text-xs",
              "text-gray-500"
            )}
          >
            {getUSDateFromString(createdAt)}
          </p>
          <ul className="divide-y divide-gray-300 dark:divide-gray-700 flex flex-col mt-4 w-full">
            {Object.entries(properties).map(([key, value]) => (
              <li key={key} className="flex flex-col py-4 space-y-2">
                {/* <Badge>{key}</Badge> */}
                <p
                  className={clsx(
                    size === "large" ? "text-xl" : "text-md",
                    "font-semibold text-black dark:text-white"
                  )}
                >
                  {key}
                </p>
                <p
                  className={clsx(
                    size === "large" ? "text-md" : "text-sm",
                    "text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
                  )}
                >
                  {value} fsdlkfjdslk jfj sdlkfdsj jfdslkf jsdkljf jlfkdjflksf
                  lksdjf
                </p>
              </li>
            ))}
            <div className="flex flex-col justify-end h-[1000px]">
              <div id="hello">Hello</div>
            </div>
          </ul>
        </div>
      </ThemedModal>
    </>
  );
};

export default PromptPropertyCard;
