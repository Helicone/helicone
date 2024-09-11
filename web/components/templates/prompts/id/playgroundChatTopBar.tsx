import React from "react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";

export const PROMPT_MODES = ["Pretty", "JSON", "Markdown"] as const;

function cycleMode(
  mode: (typeof PROMPT_MODES)[number]
): (typeof PROMPT_MODES)[number] {
  const index = PROMPT_MODES.indexOf(mode);
  return PROMPT_MODES[(index + 1) % PROMPT_MODES.length];
}

interface PlaygroundChatTopBarProps {
  mode: (typeof PROMPT_MODES)[number];
  setMode: (mode: (typeof PROMPT_MODES)[number]) => void;
  isEditMode: boolean;
  setIsEditMode: (isEditMode: boolean) => void;
}

export const PlaygroundChatTopBar: React.FC<PlaygroundChatTopBarProps> = ({
  mode,
  setMode,
  isEditMode,
  setIsEditMode,
}) => {
  return (
    <div className="h-12 px-2 rounded-t-md flex flex-row items-center justify-between w-full bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
      <div className="flex flex-row items-center space-x-2 py-2">
        <div className="flex rounded-md overflow-hidden ">
          <button
            onClick={() => setIsEditMode(true)}
            className={`py-1 px-3 text-xs font-semibold ${
              !isEditMode
                ? " text-gray-700 dark:text-gray-300"
                : "bg-[#F1F5F9] border border-[#CBD5E1] dark:border-gray-700 dark:bg-black text-gray-700 dark:text-gray-300 py-2 ml-2 rounded-md"
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setIsEditMode(false)}
            className={`py-1 px-3 text-xs font-semibold ${
              isEditMode
                ? " text-gray-700 dark:text-gray-300"
                : "bg-[#F1F5F9] border border-[#CBD5E1] dark:border-gray-700 dark:bg-black text-gray-700 dark:text-gray-300 py-2 mr-2 rounded-md"
            }`}
          >
            Preview
          </button>
        </div>
      </div>
      <div className="flex flex-row items-center space-x-2">
        <button
          onClick={() => {
            setMode(cycleMode(mode));
          }}
          className="flex flex-row space-x-1 items-center hover:bg-gray-200 dark:hover:bg-gray-800 py-1 px-2 rounded-lg"
        >
          <ChevronUpDownIcon className="h-4 w-4" />
          <p className="text-xs font-semibold">{mode}</p>
        </button>
      </div>
    </div>
  );
};
