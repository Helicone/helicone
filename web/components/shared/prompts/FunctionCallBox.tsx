import { JsonRenderer } from "@/components/templates/requests/components/chatComponent/single/JsonRenderer";
import { Message } from "packages/llm-mapper/types";

interface FunctionCallBoxProps {
  message: Message;
  disabled?: boolean;
}

export default function FunctionCallBox({
  message,
  disabled = false,
}: FunctionCallBoxProps) {
  // Ensure the message type is contentArray and it contains at least one element
  if (
    message._type !== "contentArray" ||
    !message.contentArray ||
    message.contentArray.length === 0
  ) {
    return null;
  }

  // Find the first function call within the contentArray
  const functionCallMessage = message.contentArray.find(
    (item) => item._type === "function" || item._type === "functionCall"
  );

  // If no function call message is found, or if it doesn't have tool_calls, return null
  if (!functionCallMessage) {
    return null;
  }

  // Render the tool calls using JsonRenderer
  return (
    <div
      className={`w-full px-4 group relative grid h-full focus-within:border-transparent focus-within:ring-2 focus-within:ring-heliblue rounded-xl bg-white dark:bg-black ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <JsonRenderer
        data={
          functionCallMessage.tool_calls ?? (functionCallMessage.content as any)
        }
        level={0}
        isExpanded={true}
        showCopyButton={false}
      />
    </div>
  );
}
