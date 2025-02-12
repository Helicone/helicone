import { MappedLLMRequest, Message } from "@/packages/llm-mapper/types";
import {
  PiCodeBold,
  PiGearBold,
  PiMicrophoneBold,
  PiTextTBold,
} from "react-icons/pi";

interface RealtimeProps {
  mappedRequest: MappedLLMRequest;
}

type MessageType =
  | "text"
  | "audio"
  | "functionCall"
  | "functionOutput"
  | "session";

export const Realtime: React.FC<RealtimeProps> = ({ mappedRequest }) => {
  // Get all messages sorted by timestamp
  const getAllMessages = (): Message[] => {
    const requestMessages = mappedRequest.schema.request?.messages || [];
    const responseMessages = mappedRequest.schema.response?.messages || [];
    const allMessages = [...requestMessages, ...responseMessages];

    return allMessages.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeA - timeB;
    });
  };
  const sortedMessages = getAllMessages();

  const getMessageType = (message: any): MessageType => {
    if (message._type === "functionCall") return "functionCall";
    if (message._type === "function") return "functionOutput";
    if (message._type === "message") return "session";
    if (message._type === "audio") return "audio";
    return "text";
  };

  const ModailityIcon = ({ type }: { type: MessageType }) => {
    switch (type) {
      case "audio":
        return <PiMicrophoneBold size={14} className="text-secondary" />;
      case "functionCall":
      case "functionOutput":
        return <PiCodeBold size={14} className="text-secondary" />;
      case "session":
        return <PiGearBold size={14} className="text-secondary" />;
      case "text":
      default:
        return <PiTextTBold size={14} className="text-secondary" />;
    }
  };

  return (
    <div className="w-full">
      {/* Messages Section */}
      <div className="gap-4">
        {sortedMessages.map((message, idx) => {
          const isUser = message.role === "user";
          const timestamp = message.timestamp
            ? new Date(message.timestamp).toLocaleTimeString()
            : null;
          const messageType = getMessageType(message);

          return (
            <div
              key={`${idx}-${message.timestamp}-${message.content}`}
              className={`flex flex-col ${
                isUser ? "items-end" : "items-start"
              } mb-4 w-full`}
            >
              <div className="flex flex-col gap-1 max-w-[80%]">
                {/* Message Header */}
                <div
                  className={`flex items-center space-x-2 text-xs text-secondary ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <span>{isUser ? "User" : "Assistant"}</span>
                  {timestamp && (
                    <>
                      <span>•</span>
                      <ModailityIcon type={messageType} />
                      <span>•</span>
                      <span>{timestamp}</span>
                    </>
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={`rounded-lg p-3 ${
                    isUser
                      ? `bg-blue-500 text-white ${
                          messageType === "session" ||
                          messageType === "functionCall" ||
                          messageType === "functionOutput"
                            ? "border-4 border-blue-400 dark:border-blue-600"
                            : ""
                        }`
                      : `bg-slate-100 dark:bg-slate-900 ${
                          messageType === "session" ||
                          messageType === "functionCall" ||
                          messageType === "functionOutput"
                            ? "border-4 border-slate-50 dark:border-slate-950"
                            : ""
                        }`
                  }`}
                >
                  {messageType === "functionCall" && message.tool_calls ? (
                    <FunctionCallContent toolCalls={message.tool_calls} />
                  ) : messageType === "functionOutput" ? (
                    <FunctionOutputContent
                      content={message.content || ""}
                      toolCallId={message.tool_call_id}
                    />
                  ) : messageType === "session" ? (
                    <SessionUpdate content={message.content || ""} />
                  ) : (
                    <div className="whitespace-pre-wrap break-words">
                      {message.content || ""}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                         Special Message Components                         */
/* -------------------------------------------------------------------------- */

interface SessionUpdateProps {
  content: string;
}
const SessionUpdate: React.FC<SessionUpdateProps> = ({ content }) => {
  try {
    const sessionData = JSON.parse(content);
    if (sessionData.type === "session.update" && sessionData.session) {
      const { modalities, voice, instructions, tools } = sessionData.session;
      const items = [
        {
          label: "Modalities",
          value: Array.isArray(modalities) ? modalities.join(", ") : null,
        },
        { label: "Voice", value: voice || null },
        { label: "Instructions", value: instructions || null },
        {
          label: "Available Tools",
          value: tools?.map((t: any) => t.name).join(", ") || null,
        },
      ].filter((item) => item.value);

      return (
        <div className="flex flex-col gap-1.5">
          {items.map(
            ({ label, value }) =>
              value && (
                <div key={label}>
                  <span className="font-medium">{label}:</span>{" "}
                  <span className="text-slate-300">{value}</span>
                </div>
              )
          )}
        </div>
      );
    }
  } catch (e) {}
  return <div className="whitespace-pre-wrap break-words">{content}</div>;
};

interface FunctionCallContentProps {
  toolCalls: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
}
const FunctionCallContent: React.FC<FunctionCallContentProps> = ({
  toolCalls,
}) => {
  if (!toolCalls?.[0]) return null;
  const { name, arguments: args } = toolCalls[0];

  return (
    <div className="font-mono">
      <span className="text-yellow-500 dark:text-yellow-400">{name}</span>
      {args && (
        <span className="text-slate-600 dark:text-slate-300">
          {"({"}
          {Object.entries(args).map(([key, value], i) => (
            <span key={key}>
              {i > 0 && ", "}
              {key}:{" "}
              {typeof value === "string" ? `"${value}"` : JSON.stringify(value)}
            </span>
          ))}
          {"})"}
        </span>
      )}
    </div>
  );
};

interface FunctionOutputContentProps {
  content: string;
  toolCallId?: string;
}
const FunctionOutputContent: React.FC<FunctionOutputContentProps> = ({
  content,
  toolCallId,
}) => {
  return (
    <div className="font-mono">
      <span className="text-green-300">
        {toolCallId ? `[${toolCallId}] ` : ""}
      </span>
      <span className="text-slate-300">{content}</span>
    </div>
  );
};
