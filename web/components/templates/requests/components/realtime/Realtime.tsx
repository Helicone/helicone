import { MappedLLMRequest, Message } from "@/packages/llm-mapper/types";

interface RealtimeProps {
  mappedRequest: MappedLLMRequest;
}

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

  const renderMessage = (message: Message) => {
    const isUser = message.role === "user";
    const content =
      typeof message.content === "string"
        ? message.content
        : JSON.stringify(message.content);

    const timestamp = message.timestamp
      ? new Date(message.timestamp).toLocaleTimeString()
      : null;

    return (
      <div
        key={`${message.timestamp}-${content}`}
        className={`flex flex-col ${
          isUser ? "items-end" : "items-start"
        } mb-4 w-full`}
      >
        <div className="flex flex-col space-y-1 max-w-[80%]">
          <div
            className={`flex items-center space-x-2 text-xs text-gray-500 ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            <span>{isUser ? "User" : "Assistant"}</span>
            {timestamp && <span>• {timestamp}</span>}
          </div>
          <div
            className={`rounded-lg p-3 ${
              isUser
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            }`}
          >
            <div className="whitespace-pre-wrap break-words">{content}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderHeader = () => {
    const rawRequest = mappedRequest.raw.request || {};
    const features = [];

    if (rawRequest.modalities?.length) {
      features.push(
        <div key="modalities" className="flex items-center space-x-1.5">
          <span className="font-medium">Modalities:</span>
          <span className="text-gray-600 dark:text-gray-300">
            {Array.isArray(rawRequest.modalities)
              ? rawRequest.modalities.join(", ")
              : rawRequest.modalities}
          </span>
        </div>
      );
    }

    if (rawRequest.voice) {
      features.push(
        <div key="voice" className="flex items-center space-x-1.5">
          <span className="font-medium">Voice:</span>
          <span className="text-gray-600 dark:text-gray-300">
            {rawRequest.voice}
          </span>
        </div>
      );
    }

    if (features.length === 0) return null;

    return (
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Realtime Session Features
        </div>
        <div className="flex flex-wrap gap-4">{features}</div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {renderHeader()}
      <div className="space-y-4">
        {sortedMessages.map((message) => renderMessage(message))}
      </div>
    </div>
  );
};
