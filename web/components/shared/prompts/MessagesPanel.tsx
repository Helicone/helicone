import ImageBox from "@/components/shared/prompts/ImageBox";
import PromptBox from "@/components/shared/prompts/PromptBox";
import { Button } from "@/components/ui/button";
import { StateVariable } from "@/types/prompt-state";
import { isLastMessageUser } from "@/utils/messages";
import {
  heliconeToTemplateTags,
  templateToHeliconeTags,
} from "@/utils/variables";
import { Message } from "packages/llm-mapper/types";
import {
  PiDiceOneBold,
  PiDiceTwoBold,
  PiMagicWandBold,
  PiTrashBold,
} from "react-icons/pi";
import GlassHeader from "../universal/GlassHeader";

interface PromptPanelsProps {
  messages: Message[];
  onMessageChange: (index: number, content: string) => void;
  onAddMessagePair: () => void;
  onAddPrefill: () => void;
  onRemoveMessage: (index: number) => void;
  onVariableCreate: (variable: StateVariable) => void;
  variables: StateVariable[];
  isPrefillSupported: boolean;
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
}: PromptPanelsProps) {
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
    else return true;
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Messages */}
      {messages.map((msg, index) => {
        const isRemovable = isRemovableMessage(index);

        return (
          <div key={index} className="flex flex-col">
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
              {index === 0 && areFirstMessagesEmpty && (
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
              )}

              {/* Remove Message */}
              {isRemovable && (
                <Button
                  variant={"outline"}
                  size={"square_icon"}
                  asPill
                  onClick={() => onRemoveMessage(index)}
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

      {/* Add Message Pair and/or Prefill Message */}
      <div className="flex flex-row gap-4 p-4">
        <button
          onClick={onAddMessagePair}
          disabled={!canAddMessagePair}
          className={`flex flex-row items-center gap-2 text-sm ${
            canAddMessagePair
              ? "text-heliblue hover:underline"
              : "cursor-not-allowed text-tertiary"
          }`}
        >
          <PiDiceTwoBold />
          Add Message Pair
        </button>

        {isPrefillSupported && (
          <button
            onClick={onAddPrefill}
            disabled={!canAddMessagePair}
            className={`flex flex-row items-center gap-2 text-sm ${
              canAddMessagePair
                ? "text-emerald-400 hover:underline"
                : "cursor-not-allowed text-tertiary"
            }`}
          >
            <PiDiceOneBold />
            Add Prefill Message
          </button>
        )}
      </div>
    </div>
  );
}
