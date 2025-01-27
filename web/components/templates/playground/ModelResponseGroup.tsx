import React from "react";

import { clsx } from "../../shared/clsx";
import RoleButton from "./new/roleButton";
import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";
import { TrashIcon } from "@heroicons/react/24/outline";
import ModelPill from "../requests/modelPill";
import { Message } from "@/packages/cost/llm-mappers/types";

interface ModelResponseGroupProps {
  modelMessage: Message[];
  setCurrentChat: React.Dispatch<React.SetStateAction<Message[]>>;
}

const ModelResponseGroup: React.FC<ModelResponseGroupProps> = ({
  modelMessage,
  setCurrentChat,
}) => {
  return (
    <div className="flex flex-col px-8 py-4 space-y-8 bg-white dark:bg-black border-t border-gray-300 dark:border-gray-700">
      <div className="w-full flex justify-between">
        <RoleButton
          role={"assistant"}
          onRoleChange={() => {}}
          disabled={true}
        />
        <Tooltip title="Delete Row" placement="top">
          <button
            onClick={() => {
              setCurrentChat((prevChat) =>
                prevChat.filter((message) => message.model === undefined)
              );
            }}
            className="text-red-500 font-semibold"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </Tooltip>
      </div>

      <div
        className={clsx(
          modelMessage.length > 3
            ? `grid-cols-3`
            : `grid-cols-${modelMessage.length}`,
          "w-full justify-between grid gap-4"
        )}
      >
        {modelMessage.map((message, idx) => (
          <div
            key={idx}
            className={clsx(
              idx % 3 === 0
                ? ""
                : "pl-4 border-l border-gray-300 dark:border-gray-700",
              "w-full h-auto flex flex-col space-y-2 col-span-1 relative"
            )}
          >
            <div className="flex justify-center items-center">
              <ModelPill model={message.model ?? ""} />
            </div>
            <div className="p-4 text-gray-900 dark:text-gray-100">
              <p>{message.content}</p>
            </div>
            <div className="flex w-full justify-end pt-4 text-xs text-gray-900 dark:text-gray-100">
              <p
                className={clsx(
                  "bg-gray-50 text-gray-700 ring-gray-200",
                  `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                )}
              >{`${message.latency} ms`}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelResponseGroup;
