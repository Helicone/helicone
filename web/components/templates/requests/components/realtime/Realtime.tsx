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

type ContentItem = {
  type: "text" | "audio";
  text?: string;
  transcript?: string;
};

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

  // Get the latest session configuration from session.update messages
  const getLatestSessionConfig = () => {
    const sessionMessage = sortedMessages
      .filter(
        (msg) =>
          typeof msg.content === "string" &&
          msg.content.includes("session.update")
      )
      .pop();

    if (sessionMessage) {
      try {
        const sessionData = JSON.parse(sessionMessage.content || "{}");
        if (sessionData.type === "session.update" && sessionData.session) {
          const { modalities, voice, instructions, tools } =
            sessionData.session;
          return {
            Modalities: Array.isArray(modalities)
              ? modalities.join(", ")
              : null,
            Voice: voice || null,
            Instructions: instructions || null,
            Tools: tools?.map((t: any) => t.name).join(", ") || null,
          };
        }
      } catch (e) {}
    }

    // Fallback to raw request if no session update found
    const rawRequest = mappedRequest.raw.request || {};
    return {
      Modalities: rawRequest.modalities?.length
        ? Array.isArray(rawRequest.modalities)
          ? rawRequest.modalities.join(", ")
          : rawRequest.modalities
        : null,
      Voice: rawRequest.voice || null,
      Instructions: rawRequest.instructions || null,
      Tools:
        rawRequest.tools?.map((tool: any) => tool.function.name).join(", ") ||
        null,
    };
  };

  const activeFeatures = Object.entries(getLatestSessionConfig()).filter(
    ([_, value]) => value !== null
  );

  const getMessageContent = (message: Message) => {
    if (
      typeof message.content === "string" &&
      message.content.includes("session.update")
    ) {
      try {
        const sessionData = JSON.parse(message.content);
        if (sessionData.type === "session.update" && sessionData.session) {
          const { modalities, voice, instructions, tools } =
            sessionData.session;
          return {
            text: JSON.stringify({
              modalities,
              voice,
              instructions,
              tools: tools?.map((t: any) => t.name),
            }),
            type: "session",
          };
        }
      } catch (e) {
        // If parsing fails, fall back to default handling
      }
    }

    if (message._type === "functionCall" && message.tool_calls?.[0]) {
      const toolCall = message.tool_calls[0];
      return {
        text: JSON.stringify({
          function: toolCall.name,
          arguments: toolCall.arguments,
        }),
        type: "function",
      };
    }
    if (message._type === "contentArray" && message.contentArray?.[0]) {
      const content = message.contentArray[0] as unknown as ContentItem;
      return {
        text: content.type === "audio" ? content.transcript : content.text,
        type: content.type,
      };
    }
    return {
      text: message.content || "",
      type: "text",
    };
  };

  const ModailityIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "audio":
        return <PiMicrophoneBold size={14} className="text-secondary" />;
      case "function":
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
      {/* Header Section - Displays modalities and voice features if present */}
      {activeFeatures.length > 0 && (
        <div className="mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="text-xs text-secondary uppercase tracking-wider mb-2">
            Realtime Session Features
          </div>
          <div className="flex flex-wrap gap-4">
            {activeFeatures.map(([label, value]) => (
              <div key={label} className="flex gap-1.5">
                <span className="font-medium">{label}:</span>
                <span className="text-secondary">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Section - Renders the chat messages in chronological order */}
      <div className="gap-4">
        {sortedMessages.map((message) => {
          const isUser = message.role === "user";
          const { text, type } = getMessageContent(message);
          const timestamp = message.timestamp
            ? new Date(message.timestamp).toLocaleTimeString()
            : null;

          return (
            <div
              key={`${message.timestamp}-${text}`}
              className={`flex flex-col ${
                isUser ? "items-end" : "items-start"
              } mb-4 w-full`}
            >
              <div className="flex flex-col gap-1 max-w-[80%]">
                {/* Message Header - Shows role, timestamp, and modality */}
                <div
                  className={`flex items-center space-x-2 text-xs text-secondary ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <span>{isUser ? "User" : "Assistant"}</span>
                  {timestamp && (
                    <>
                      <span>•</span>
                      <ModailityIcon type={type} />
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
                          type === "session" || type === "function"
                            ? "border-4 border-blue-400 dark:border-blue-600"
                            : ""
                        }`
                      : `bg-slate-100 dark:bg-slate-900 ${
                          type === "session" || type === "function"
                            ? "border-4 border-slate-50 dark:border-slate-950"
                            : ""
                        }`
                  }`}
                >
                  {type === "session" ? (
                    <SessionUpdate {...JSON.parse(text)} />
                  ) : type === "function" ? (
                    <FunctionCall {...JSON.parse(text)} />
                  ) : (
                    <div className="whitespace-pre-wrap break-words">
                      {text}
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
  modalities?: string[];
  voice?: string;
  instructions?: string;
  tools?: string[];
}
const SessionUpdate: React.FC<SessionUpdateProps> = ({
  modalities,
  voice,
  instructions,
  tools,
}) => {
  const items = [
    { label: "Modalities", value: modalities?.join(", ") },
    { label: "Voice", value: voice },
    { label: "Instructions", value: instructions },
    { label: "Available Tools", value: tools?.join(", ") },
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
};

interface FunctionCallProps {
  function: string;
  arguments?: Record<string, any>;
}
const FunctionCall: React.FC<FunctionCallProps> = ({
  function: name,
  arguments: args,
}) => {
  return (
    <div className="font-mono">
      <span className="text-yellow-500 dark:text-yellow-400">{name}</span>
      {args && (
        <span className="text-slate-600 dark:text-slate-300">
          (
          {Object.entries(args).map(([key, value], i) => (
            <span key={key}>
              {"{"}
              {i > 0 && ", "}
              {key}:{" "}
              {typeof value === "string" ? `"${value}"` : JSON.stringify(value)}
              {"}"}
            </span>
          ))}
          )
        </span>
      )}
    </div>
  );
};
