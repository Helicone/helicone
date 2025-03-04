// Enhanced component for realtime turn nodes
import { Message } from "@/packages/llm-mapper/types";
import { ChevronRightIcon, ClockIcon, MessageSquareIcon } from "lucide-react";
import { useMemo } from "react";
import { Row } from "../../../../layout/common/row";
import { clsx } from "../../../../shared/clsx";

interface RealtimeTurnNodeProps {
  turnIndex: number;
  turn: Message[];
  isSelected: boolean;
  onClick: () => void;
}
export const RealtimeTurnNode: React.FC<RealtimeTurnNodeProps> = ({
  turnIndex,
  turn,
  isSelected,
  onClick,
}) => {
  // Extract role from the first message with a role
  const roleMessage = turn.find((msg) => msg.role);
  const role = roleMessage?.role || "unknown";
  const messageCount = turn.length;

  // Find the earliest timestamp in this turn
  const timestamp = useMemo(() => {
    const timestamps = turn
      .filter((msg) => msg.timestamp)
      .map((msg) => new Date(msg.timestamp!).getTime());

    if (timestamps.length === 0) return null;

    const earliestTime = new Date(Math.min(...timestamps));
    return earliestTime.toLocaleTimeString();
  }, [turn]);

  // Count message types
  const messageTypes = useMemo(() => {
    const types: Record<string, number> = {
      text: 0,
      audio: 0,
      function: 0,
      session: 0,
    };

    turn.forEach((msg) => {
      if (msg._type === "audio") types.audio++;
      else if (msg._type === "functionCall" || msg._type === "function")
        types.function++;
      else if (
        msg._type === "message" &&
        msg.content &&
        (msg.content.startsWith("{") || msg.content.includes('"session":'))
      )
        types.session++;
      else types.text++;
    });

    return types;
  }, [turn]);

  // Determine type for styling
  const type = role === "user" ? "user" : "assistant";

  // Style based on type
  const bgColorMap = {
    user: "bg-blue-500 dark:bg-blue-700 text-blue-700 text-slate-200 dark:text-white",
    assistant:
      "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300",
    unknown: "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
  };

  // Find a preview of the content (first few characters of the first text message)
  const contentPreview = useMemo(() => {
    const textMessage = turn.find(
      (msg) =>
        msg._type !== "audio" &&
        msg._type !== "functionCall" &&
        msg._type !== "function" &&
        msg.content &&
        !msg.content.startsWith("{") &&
        !msg.content.includes('"session":')
    );

    if (!textMessage || !textMessage.content) return null;

    const preview = textMessage.content.substring(0, 60);
    return preview.length < textMessage.content.length
      ? `${preview}...`
      : preview;
  }, [turn]);

  return (
    <div
      className={clsx(
        "flex flex-col dark:bg-slate-900 py-3 pl-4 px-4 cursor-pointer w-full border-b border-slate-200 dark:border-slate-800",
        isSelected
          ? "bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700"
          : "bg-white dark:bg-slate-950 hover:bg-sky-50 dark:hover:bg-slate-900"
      )}
      onClick={onClick}
    >
      <Row className="w-full gap-2 items-center justify-between">
        <Row className="items-center gap-2 flex-grow min-w-0">
          <div
            className={clsx(
              "flex-shrink-0 px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap flex items-center gap-1",
              bgColorMap[type as keyof typeof bgColorMap]
            )}
          >
            <MessageSquareIcon size={14} /> {role}
          </div>
          <div className="flex-grow flex-shrink-1 bg-transparent dark:bg-transparent text-slate-700 dark:text-slate-200 px-2 py-1 text-xs font-medium">
            <div className="font-medium">Turn {turnIndex + 1}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <ClockIcon size={12} /> {timestamp || "Unknown time"}
            </div>
          </div>
        </Row>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 pr-1">
          {messageCount} message{messageCount !== 1 ? "s" : ""}
          <ChevronRightIcon
            size={14}
            className={isSelected ? "text-blue-500" : ""}
          />
        </div>
      </Row>
    </div>
  );
};
