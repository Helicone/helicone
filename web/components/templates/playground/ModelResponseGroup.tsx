import React from "react";

import { clsx } from "../../shared/clsx";
import RoleButton from "./new/roleButton";
import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";
import { TrashIcon } from "@heroicons/react/24/outline";
import ModelPill from "../requests/modelPill";
import { Message } from "@helicone-package/llm-mapper/types";

// Extend Message type to include model property
type ExtendedMessage = Message & {
  model?: string;
};

interface ModelResponseGroupProps {
  modelMessage: ExtendedMessage[];
  setCurrentChat: React.Dispatch<React.SetStateAction<ExtendedMessage[]>>;
}

const ModelResponseGroup: React.FC<ModelResponseGroupProps> = ({
  modelMessage,
  setCurrentChat,
}) => {
  return (
    <div className="flex flex-col space-y-8 border-t border-gray-300 bg-white px-8 py-4 dark:border-gray-700 dark:bg-black">
      <div className="flex w-full justify-between">
        <RoleButton
          role={"assistant"}
          onRoleChange={() => {}}
          disabled={true}
        />
        <Tooltip title="Delete Row" placement="top">
          <button
            onClick={() => {
              setCurrentChat((prevChat) =>
                prevChat.filter((message) => message.model === undefined),
              );
            }}
            className="font-semibold text-red-500"
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
          "grid w-full justify-between gap-4",
        )}
      >
        {modelMessage.map((message, idx) => (
          <div
            key={idx}
            className={clsx(
              idx % 3 === 0
                ? ""
                : "border-l border-gray-300 pl-4 dark:border-gray-700",
              "relative col-span-1 flex h-auto w-full flex-col space-y-2",
            )}
          >
            <div className="flex items-center justify-center">
              <ModelPill model={message.model ?? ""} />
            </div>
            <div className="p-4 text-gray-900 dark:text-gray-100">
              <p>{message.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelResponseGroup;
