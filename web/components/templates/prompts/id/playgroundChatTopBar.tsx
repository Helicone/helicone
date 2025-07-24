import React from "react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";

export const PROMPT_MODES = ["Pretty", "JSON", "Markdown"] as const;

function cycleMode(
  mode: (typeof PROMPT_MODES)[number],
): (typeof PROMPT_MODES)[number] {
  const index = PROMPT_MODES.indexOf(mode);
  return PROMPT_MODES[(index + 1) % PROMPT_MODES.length];
}

interface PlaygroundChatTopBarProps {
  mode: (typeof PROMPT_MODES)[number];
  setMode: (mode: (typeof PROMPT_MODES)[number]) => void;
  isEditMode: boolean;
  setIsEditMode: (isEditMode: boolean) => void;
  isPromptCreatedFromUi?: boolean;
}

export const PlaygroundChatTopBar: React.FC<PlaygroundChatTopBarProps> = ({
  mode,
  setMode,
  isEditMode,
  setIsEditMode,
  isPromptCreatedFromUi,
}) => {
  return (
    <div className="flex h-12 w-full flex-row items-center justify-between rounded-t-md border-slate-200 bg-slate-50 px-2 text-slate-900 dark:border-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex flex-row items-center space-x-2 py-2">
        <div className="flex overflow-hidden rounded-md">
          {isPromptCreatedFromUi && isPromptCreatedFromUi === true && (
            <button
              onClick={() => setIsEditMode(true)}
              className={`px-3 py-1 text-xs font-semibold ${
                !isEditMode
                  ? "text-slate-700 dark:text-slate-300"
                  : "ml-2 rounded-md border border-[#CBD5E1] bg-[#F1F5F9] py-2 text-slate-700 dark:border-slate-700 dark:bg-black dark:text-slate-300"
              }`}
            >
              Edit
            </button>
          )}
          <button
            onClick={() => setIsEditMode(false)}
            className={`px-3 py-1 text-xs font-semibold ${
              isEditMode
                ? "text-slate-700 dark:text-slate-300"
                : "mr-2 rounded-md border border-[#CBD5E1] bg-[#F1F5F9] py-2 text-slate-700 dark:border-slate-700 dark:bg-black dark:text-slate-300"
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
          className="flex flex-row items-center space-x-1 rounded-lg px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-800"
        >
          <ChevronUpDownIcon className="h-4 w-4" />
          <p className="text-xs font-semibold">{mode}</p>
        </button>
      </div>
    </div>
  );
};
