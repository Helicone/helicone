import { Variable } from "@/types/prompt-state";
import {
  PiDiceOneBold,
  PiDiceTwoBold,
  PiMagicWandBold,
  PiTrashBold,
} from "react-icons/pi";
import { isLastMessageUser } from "@/utils/messages";
import PromptBox from "@/components/shared/prompts/PromptBox";
import {
  templateToHeliconeTags,
  heliconeToTemplateTags,
} from "@/utils/variables";
import { Button } from "@/components/ui/button";
import { StateMessage } from "@/types/prompt-state";

interface PromptPanelsProps {
  messages: StateMessage[];
  onMessageChange: (index: number, content: string) => void;
  onAddMessagePair: () => void;
  onAddPrefill: () => void;
  onRemoveMessage: (index: number) => void;
  onVariableCreate: (variable: Variable) => void;
  variables: Variable[];
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
  const canAddMessages = isLastMessageUser(messages);
  // - Is message removable?
  const isRemovableMessage = (index: number) => {
    // First system and user messages are not removable
    if (index <= 1) return false;
    else return true;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Messages */}
      {messages.map((msg, index) => {
        const isRemovable = isRemovableMessage(index);

        return (
          <div key={index} className="flex flex-col gap-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              {/* Message Role */}
              <h2 className="font-semibold">
                <span className="capitalize text-secondary">{msg.role}</span>
                {msg.idx !== undefined && (
                  <span className="text-tertiary"> - message_{msg.idx}</span>
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
            </div>

            {/* Prompt Box */}
            <PromptBox
              value={heliconeToTemplateTags(msg.content)}
              onChange={(content) =>
                onMessageChange(index, templateToHeliconeTags(content))
              }
              onVariableCreate={onVariableCreate}
              contextText={""} // TODO: Add context for better auto-complete
              variables={variables}
              disabled={msg.idx !== undefined}
            />
          </div>
        );
      })}

      {/* Add Message Pair and/or Prefill Message */}
      <div className="flex flex-row gap-4">
        <button
          onClick={onAddMessagePair}
          disabled={!canAddMessages}
          className={`flex flex-row items-center gap-2 text-sm ${
            canAddMessages
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
            disabled={!canAddMessages}
            className={`flex flex-row items-center gap-2 text-sm ${
              canAddMessages
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
