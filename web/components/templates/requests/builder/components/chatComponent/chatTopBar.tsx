import React from "react";
import {
  ArrowsPointingOutIcon,
  BeakerIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/router";
import { Message } from "./types";

export const PROMPT_MODES = ["Pretty", "JSON", "Markdown"] as const;

function cycleMode(
  mode: (typeof PROMPT_MODES)[number]
): (typeof PROMPT_MODES)[number] {
  const index = PROMPT_MODES.indexOf(mode);
  return PROMPT_MODES[(index + 1) % PROMPT_MODES.length];
}

interface ChatTopBarProps {
  allExpanded: boolean;
  toggleAllExpanded: () => void;
  requestMessages: Message[];
  requestId: string;
  model: string;
  setOpen: (open: boolean) => void;
  mode: (typeof PROMPT_MODES)[number];
  setMode: (mode: (typeof PROMPT_MODES)[number]) => void;
  isModal?: boolean;
}

export const ChatTopBar: React.FC<ChatTopBarProps> = ({
  allExpanded,
  toggleAllExpanded,
  requestMessages,
  requestId,
  model,
  setOpen,
  mode,
  setMode,
  isModal = false,
}) => {
  const router = useRouter();

  return (
    <div className="h-10 px-2 rounded-md flex flex-row items-center justify-between w-full bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100">
      <div className="flex flex-row items-center space-x-2">
        <button
          onClick={toggleAllExpanded}
          className="flex flex-row space-x-1 items-center hover:bg-slate-200 dark:hover:bg-slate-800 py-1 px-2 rounded-lg"
        >
          {allExpanded ? (
            <EyeSlashIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
          <p className="text-xs font-semibold">
            {allExpanded ? "Shrink All" : "Expand All"}
          </p>
        </button>
        {!(
          model === "gpt-4-vision-preview" ||
          model === "gpt-4-1106-vision-preview" ||
          requestId === ""
        ) && (
          <button
            onClick={() => {
              if (requestMessages) {
                router.push("/playground?request=" + requestId);
              }
            }}
            className="flex flex-row space-x-1 items-center hover:bg-slate-200 dark:hover:bg-slate-800 py-1 px-2 rounded-lg"
          >
            <BeakerIcon className="h-4 w-4" />
            <p className="text-xs font-semibold">Playground</p>
          </button>
        )}
      </div>
      <div className="flex flex-row items-center space-x-2">
        {!isModal && (
          <button
            onClick={() => setOpen(true)}
            className="flex flex-row space-x-1 items-center hover:bg-slate-200 dark:hover:bg-slate-800 py-1 px-2 rounded-lg"
          >
            <ArrowsPointingOutIcon className="h-4 w-4" />
            <p className="text-xs font-semibold">Expand</p>
          </button>
        )}
        <button
          onClick={() => {
            setMode(cycleMode(mode));
          }}
          className="flex flex-row space-x-1 items-center hover:bg-slate-200 dark:hover:bg-slate-800 py-1 px-2 rounded-lg"
        >
          <ChevronUpDownIcon className="h-4 w-4" />
          <p className="text-xs font-semibold">{mode}</p>
        </button>
      </div>
    </div>
  );
};
