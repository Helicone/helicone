import { Tooltip } from "@mui/material";
import { clsx } from "../../../shared/clsx";
import useNotification from "../../../shared/notification/useNotification";
import { getUSDateFromString } from "../../../shared/utils/utils";
import { ArrowsPointingOutIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import ThemedModal from "../../../shared/themed/themedModal";
import { Badge } from "@tremor/react";
import { useRouter } from "next/router";
import { Col } from "../../../layout/common";

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
      <div
        className={clsx(
          isSelected
            ? "bg-sky-100 border-sky-500 dark:bg-sky-950"
            : "bg-white border-gray-300 dark:bg-black dark:border-gray-700",
          "w-full border px-4 py-2 "
        )}
      >
        <div className={clsx("flex flex-col w-full")}>
          <div className="flex flex-col space-y-1 items-start w-full">
            <div className="flex items-center w-full justify-between text-left">
              {onSelect ? (
                <button onClick={onSelect}>
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
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center space-x-2">
                <button
                  className="p-1 hover:bg-gray-100 rounded-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(true);
                  }}
                >
                  <ArrowsPointingOutIcon className="h-4 w-4 text-gray-500" />
                </button>
                {onRemove && (
                  <button
                    className="p-1 hover:bg-gray-100 rounded-lg"
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
        </div>
        <Col>
          <label className="text-sm text-gray-500 mt-4">User Inputs</label>
          <ul className="divide-y divide-gray-300 dark:divide-gray-700 flex flex-col w-full">
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
                  {value}
                </p>
              </li>
            ))}
          </ul>
          {autoInputs && Object.keys(autoInputs).length > 0 && (
            <>
              <label className="text-sm text-gray-500 mt-4">Auto Inputs</label>
              <ul className="flex flex-col w-full divide-y divide-gray-300 dark:divide-gray-700 mt-2">
                {Object.entries(autoInputs).map(([key, value], idx) => (
                  <li key={key} className="py-2">
                    <Tooltip title="Click to copy">
                      <span
                        className="cursor-pointer hover:opacity-75 transition-opacity duration-300"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(value));
                          setNotification("Copied to clipboard", "success");
                        }}
                      >
                        {idx}: {JSON.stringify(value).substring(0, 25)}...
                      </span>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Col>
      </div>
      <ThemedModal open={expanded} setOpen={setExpanded}>
        <div className="w-[80vw] h-full flex flex-col items-start relative">
          <div className="flex flex-col h-full items-start sticky -top-6 bg-white -mt-4 py-4 border-b border-gray-300 dark:border-gray-700 w-full">
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
            <ul className="flex flex-wrap gap-2 pt-4">
              {Object.entries(properties).map(([key, value]) => (
                <li key={key}>
                  <button
                    onClick={() => {
                      router.push(`#${key}`);
                    }}
                    className="hover:cursor-pointer"
                  >
                    <Badge size="md">{key}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <ul className="divide-y divide-gray-300 dark:divide-gray-700 flex flex-col w-full">
            {Object.entries(properties).map(([key, value]) => (
              <li key={key} className="flex flex-col py-4 space-y-2">
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
                  {value}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </ThemedModal>
    </>
  );
};

export default PromptPropertyCard;
