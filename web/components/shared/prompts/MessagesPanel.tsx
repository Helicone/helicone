import ImageBox from "@/components/shared/prompts/ImageBox";
import PromptBox from "@/components/shared/prompts/PromptBox";
import { Button } from "@/components/ui/button";
import { StateInputs } from "@/types/prompt-state";
import { getMessagesToRemove, isLastMessageUser } from "@/utils/messages";
import {
  heliconeToTemplateTags,
  templateToHeliconeTags,
} from "@/utils/variables";
import { Message } from "packages/llm-mapper/types";
import { useEffect, useRef, useState } from "react";
import { PiChatFill, PiChatsBold, PiTrashBold } from "react-icons/pi";

import Link from "next/link";
import GlassHeader from "../universal/GlassHeader";

interface MessagesPanelProps {
  messages: Message[];
  onMessageChange: (index: number, content: string) => void;
  onAddMessagePair: () => void;
  onAddPrefill: () => void;
  onRemoveMessage: (index: number) => void;
  onVariableCreate: (variable: StateInputs) => void;
  variables: StateInputs[];
  isPrefillSupported: boolean;
  scrollToBottom?: () => void;
}
export default function MessagesPanel({
  messages,
  onMessageChange,
  onAddMessagePair,
  onAddPrefill,
  onRemoveMessage,
  onVariableCreate,
  variables,
  isPrefillSupported,
  scrollToBottom,
}: MessagesPanelProps) {
  // STATES AND REFERENCES
  const [hoveredTrashIdx, setHoveredTrashIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // EFFECTS
  // - Reset hover state when messages change
  useEffect(() => {
    setHoveredTrashIdx(null);
  }, [messages.length]);

  // HELPERS
  // - Are the first two messages empty?
  const areFirstMessagesEmpty = messages
    .slice(0, 2)
    .every((msg) => msg.content === "");
  // - Can we add a message pair or prefill message?
  const canAddMessagePair = isLastMessageUser(messages);
  // - Is message removable?
  const isRemovableMessage = (index: number) => {
    // First system and user messages are not removable
    if (index <= 1) return false;
    return true;
  };
  // - Should message be highlighted for removal?
  const shouldHighlightMessage = (index: number) => {
    // If no hover index, don't highlight
    if (hoveredTrashIdx === null) return false;
    // If index is out of bounds, don't highlight
    if (
      index < 0 ||
      index >= messages.length ||
      hoveredTrashIdx >= messages.length
    )
      return false;

    const messagesToRemove = getMessagesToRemove({
      isPrefillSupported,
      messages,
      index: hoveredTrashIdx,
    });

    return messagesToRemove.includes(index);
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col gap-4">
      {/* Messages */}
      {messages.map((msg, index) => {
        const isRemovable = isRemovableMessage(index);

        return (
          <div
            key={index}
            className={`flex flex-col ${
              shouldHighlightMessage(index)
                ? "ring-1 ring-red-300 dark:ring-red-700"
                : ""
            }`}
          >
            {/* Header */}
            <GlassHeader className="h-14 px-4 flex-shrink-0">
              {/* Message Role */}
              <h2 className="font-semibold items-center">
                <h2 className="capitalize text-secondary">{msg.role}</h2>
                {msg.idx !== undefined && (
                  <h2 className="text-tertiary"> - message_{msg.idx}</h2>
                )}
              </h2>

              {/* Suggest starting prompt */}
              {/* {index === 0 && areFirstMessagesEmpty && (
                <button
                  onClick={() => {
                    onMessageChange(
                      0,
                      "You are a helpful AI assistant that provides clear, accurate answers."
                    );
                    onMessageChange(
                      1,
                      "I need help writing a professional email."
                    );
                  }}
                  className="flex flex-row items-center gap-2 text-tertiary hover:underline"
                >
                  <PiMagicWandBold />
                  Suggest starting prompt
                </button>
              )} */}

              {/* Remove Message */}
              {isRemovable && (
                <Button
                  variant={"outline"}
                  size={"square_icon"}
                  asPill
                  onMouseEnter={() => setHoveredTrashIdx(index)}
                  onMouseLeave={() => setHoveredTrashIdx(null)}
                  onClick={() => {
                    // If we're clicking on a user message and prefill isn't supported,
                    // remove from the assistant message instead
                    if (
                      !isPrefillSupported &&
                      msg.role === "user" &&
                      messages[index - 1]?.role === "assistant"
                    ) {
                      onRemoveMessage(index - 1);
                    } else {
                      onRemoveMessage(index);
                    }
                  }}
                >
                  <PiTrashBold className="w-4 h-4 text-secondary" />
                </Button>
              )}
            </GlassHeader>

            {/* Message Content */}
            {msg._type === "image" || msg.image_url ? (
              <ImageBox message={msg} disabled={msg.idx !== undefined} />
            ) : (
              <PromptBox
                value={heliconeToTemplateTags(msg.content || "")}
                onChange={(content) =>
                  onMessageChange(index, templateToHeliconeTags(content))
                }
                onVariableCreate={onVariableCreate}
                contextText={""}
                variables={variables}
                disabled={msg.idx !== undefined}
              />
            )}
          </div>
        );
      })}

      {/* Error comunication */}
      {messages.length === 0 && (
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-4 bg-red-500 rounded-lg p-4 border border-red-100 dark:border-red-900">
            <h2 className="text-white font-semibold text-lg">
              Unable to load prompt version...
            </h2>
            <div className="bg-slate-200 dark:bg-slate-800 rounded p-4 font-mono text-xs overflow-auto">
              <pre>
                {`{
  "error": "Invalid template",
  "template": "<helicone-auto-prompt-input idx=0 />"
}`}
              </pre>
            </div>
            <p className="text-white text-sm">
              Please load or import a different version to try again.{" "}
              <Link
                href="https://docs.helicone.ai/features/prompts/import"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium text-white hover:text-blue-300"
              >
                Learn more about import formatting.
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Add Message Pair and/or Prefill Message */}
      <div className="flex flex-row gap-4 p-4">
        <button
          onClick={() => {
            onAddMessagePair();
            scrollToBottom?.();
          }}
          disabled={!canAddMessagePair}
          className={`flex flex-row items-center gap-2 text-sm ${
            canAddMessagePair
              ? "text-heliblue hover:underline"
              : "cursor-not-allowed text-tertiary"
          }`}
        >
          <PiChatsBold />
          Add Message Pair
        </button>

        {isPrefillSupported && (
          <button
            onClick={() => {
              onAddPrefill();
              scrollToBottom?.();
            }}
            disabled={!canAddMessagePair}
            className={`flex flex-row items-center gap-2 text-sm ${
              canAddMessagePair
                ? "text-emerald-400 hover:underline"
                : "cursor-not-allowed text-tertiary"
            }`}
          >
            <PiChatFill />
            Add Prefill Message
          </button>
        )}
      </div>
    </div>
  );
}
