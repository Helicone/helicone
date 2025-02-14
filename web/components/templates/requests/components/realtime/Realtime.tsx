import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import React, { useState } from "react";
import {
  PiCaretDownBold,
  PiCodeBold,
  PiGearBold,
  PiMicrophoneBold,
  PiSpeakerHighBold,
  PiTextTBold,
} from "react-icons/pi";
import ReactMarkdown from "react-markdown";

type MessageType =
  | "text"
  | "audio"
  | "functionCall"
  | "functionOutput"
  | "session";

interface RealtimeProps {
  mappedRequest: MappedLLMRequest;
}
export const Realtime: React.FC<RealtimeProps> = ({ mappedRequest }) => {
  // Get all messages sorted by timestamp
  const sortedMessages = [
    ...(mappedRequest.schema.request?.messages || []),
    ...(mappedRequest.schema.response?.messages || []),
  ].sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeA - timeB;
  });

  const lastMsg = sortedMessages.findLast((msg) => msg._type === "message");
  const lastSessionUpdate = parseSessionUpdate(lastMsg?.content);

  const getMessageType = (message: any): MessageType => {
    if (message._type === "functionCall") return "functionCall";
    if (message._type === "function") return "functionOutput";
    if (message._type === "message") return "session";
    if (message._type === "audio") return "audio";
    return "text";
  };

  const ModailityIcon = ({ type }: { type: MessageType }) => {
    const icons = {
      audio: <PiMicrophoneBold size={14} className="text-secondary" />,
      functionCall: <PiCodeBold size={14} className="text-secondary" />,
      functionOutput: <PiCodeBold size={14} className="text-secondary" />,
      session: <PiGearBold size={14} className="text-secondary" />,
      text: <PiTextTBold size={14} className="text-secondary" />,
    };
    return icons[type];
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header Section */}
      {lastSessionUpdate && <SessionHeader sessionData={lastSessionUpdate} />}

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
              key={`${idx}-${message.timestamp}`}
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
/*                           Session Features Header                          */
/* -------------------------------------------------------------------------- */
const getPillStyle = (type: string, label?: string) => {
  // Special handling for modalities
  if (type === "modality") {
    const modalityStyle = {
      className:
        "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300",
    };

    switch (label) {
      case "audio":
        return {
          icon: <PiMicrophoneBold className="w-3.5 h-3.5" />,
          ...modalityStyle,
        };
      case "text":
        return {
          icon: <PiTextTBold className="w-3.5 h-3.5" />,
          ...modalityStyle,
        };
      default:
        return {
          icon: <PiTextTBold className="w-3.5 h-3.5" />,
          ...modalityStyle,
        };
    }
  }

  // Other types
  switch (type) {
    case "voice":
      return {
        icon: <PiSpeakerHighBold className="w-3.5 h-3.5" />,
        className:
          "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300",
      };
    case "tool":
      return {
        icon: <PiCodeBold className="w-3.5 h-3.5" />,
        className:
          "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
      };
    default:
      return {
        icon: null,
        className:
          "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300",
      };
  }
};

type SessionUpdateData = {
  modalities?: string[];
  voice?: string;
  tools?: Array<{ name: string }>;
  instructions?: string;
};
const parseSessionUpdate = (
  content: string | undefined
): SessionUpdateData | null => {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content)?.session;
    if (!parsed) return null;
    return parsed as SessionUpdateData;
  } catch {
    return null;
  }
};

interface SessionHeaderProps {
  sessionData: SessionUpdateData;
}

type Pill = {
  type: string;
  label: string;
  modality?: string;
};

const SessionHeader: React.FC<SessionHeaderProps> = ({ sessionData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const pills: Pill[] = [
    ...(sessionData.modalities?.map((m) => ({
      type: "modality",
      label: m,
    })) || []),
    ...(sessionData.voice ? [{ type: "voice", label: sessionData.voice }] : []),
    ...(sessionData.tools?.map((t) => ({ type: "tool", label: t.name })) || []),
  ];

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col gap-4">
      <div className="text-xs text-secondary uppercase tracking-wider">
        Realtime Session Features
      </div>

      {/* Pills Section */}
      {pills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pills.map(({ type, label }, idx) => {
            const style = getPillStyle(type, label);
            return (
              <span
                key={`${type}-${idx}`}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${style.className}`}
              >
                {style.icon}
                {label}
              </span>
            );
          })}
        </div>
      )}

      {/* Instructions Section */}
      {sessionData.instructions && (
        <div className="flex flex-col gap-2">
          <div
            className="flex items-center gap-2 cursor-pointer select-none hover:underline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="font-medium text-sm">Instructions</span>
            <PiCaretDownBold
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
          <div
            className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out ${
              isExpanded ? "max-h-96 opacity-100" : "max-h-6 opacity-70"
            }`}
          >
            <ReactMarkdown className="prose dark:prose-invert prose-sm text-secondary">
              {sessionData.instructions}
            </ReactMarkdown>
          </div>
        </div>
      )}
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
  const sessionData = parseSessionUpdate(content);
  if (!sessionData) {
    return <div className="whitespace-pre-wrap break-words">{content}</div>;
  }

  const items = [
    {
      label: "Modalities",
      pills:
        sessionData.modalities?.map((m) => ({ type: "modality", label: m })) ||
        [],
    },
    {
      label: "Voice",
      pills: sessionData.voice
        ? [{ type: "voice", label: sessionData.voice }]
        : [],
    },
    {
      label: "Available Tools",
      pills:
        sessionData.tools?.map((t) => ({ type: "tool", label: t.name })) || [],
    },
    {
      label: "Instructions",
      value: sessionData.instructions || null,
    },
  ].filter((item) => (item.pills && item.pills.length > 0) || item.value);

  return (
    <div className="flex flex-col divide-y divide-slate-300">
      {items.map(({ label, pills, value }) => (
        <div key={label} className="flex flex-row justify-between gap-4 py-2">
          <span className="font-medium">{label}:</span>
          {pills ? (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {pills.map(({ type, label }, idx) => {
                const { icon, className } = getPillStyle(type, label);
                return (
                  <span
                    key={`${type}-${idx}`}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${className}`}
                  >
                    {icon}
                    {label}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-300 truncate max-w-[16rem]">{value}</p>
          )}
        </div>
      ))}
    </div>
  );
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
