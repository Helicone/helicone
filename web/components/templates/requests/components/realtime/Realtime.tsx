import { MappedLLMRequest } from "@/packages/llm-mapper/types";
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
  const sortedMessages = [
    ...(mappedRequest.schema.request?.messages || []),
    ...(mappedRequest.schema.response?.messages || []),
  ].sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeA - timeB;
  });

  // Get session features from the latest session update or raw request
  const sessionFeatures = (() => {
    // Try to get from session update message first
    const sessionMsg = sortedMessages.find(
      (msg) =>
        typeof msg.content === "string" &&
        msg.content.includes("session.update")
    );

    let features = {};
    if (sessionMsg?.content) {
      try {
        const { session } =
          JSON.parse(sessionMsg.content).type === "session.update"
            ? JSON.parse(sessionMsg.content)
            : { session: null };
        if (session) {
          features = {
            Modalities: session.modalities?.join(", "),
            Voice: session.voice,
            Instructions: session.instructions,
            Tools: session.tools?.map((t: any) => t.name).join(", "),
          };
        }
      } catch (e) {}
    }

    // Fallback to raw request
    if (Object.keys(features).length === 0) {
      const req = mappedRequest.raw.request || {};
      features = {
        Modalities: Array.isArray(req.modalities)
          ? req.modalities.join(", ")
          : req.modalities,
        Voice: req.voice,
        Instructions: req.instructions,
        Tools: req.tools?.map((t: any) => t.function.name).join(", "),
      };
    }

    return Object.entries(features).filter(([_, v]) => v) as [string, string][];
  })();

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
    <div className="w-full">
      {/* Header Section */}
      {sessionFeatures.length > 0 && (
        <div className="mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="text-xs text-secondary uppercase tracking-wider mb-2">
            Realtime Session Features
          </div>
          <div className="flex flex-wrap gap-4">
            {sessionFeatures.map(([label, value]) => (
              <div key={label} className="flex gap-1.5">
                <span className="font-medium">{label}:</span>
                <span className="text-secondary">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
