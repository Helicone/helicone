import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { Variable } from "@/types/prompt-state";
import {
  PiDiceOneBold,
  PiDiceTwoBold,
  PiMagicWandBold,
  PiTrashBold,
} from "react-icons/pi";
import {
  canAddMessagePair,
  canAddPrefillMessage,
  isRemovableMessage,
} from "@/utils/messages";
import PromptBox from "@/components/shared/prompts/PromptBox";

interface PromptPanelsProps {
  messages: ChatCompletionMessageParam[];
  onMessageChange: (index: number, content: string) => void;
  onAddMessagePair: () => void;
  onAddPrefill: () => void;
  canAddPrefill: boolean;
  onRemoveMessage: (index: number) => void;
  onVariableCreate: (variable: Variable) => void;
  variables: Variable[];
}

export default function PromptPanels({
  messages,
  onMessageChange,
  onAddMessagePair,
  onAddPrefill,
  canAddPrefill,
  onRemoveMessage,
  onVariableCreate,
  variables,
}: PromptPanelsProps) {
  const canAddPair = canAddMessagePair(messages);
  const canAddPrefillMsg = canAddPrefillMessage(messages);

  // TODO: Out of date, changed to just deploy
  const arePromptsEmpty =
    messages.length === 2 &&
    (typeof messages[0].content === "string"
      ? messages[0].content.trim() === ""
      : false) &&
    (typeof messages[1].content === "string"
      ? messages[1].content.trim() === ""
      : false);

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message, index) => (
        <div key={index} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold capitalize text-slate-700">
              {message.role}
            </h2>
            {index === 0 && arePromptsEmpty && (
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
                className="flex flex-row items-center gap-2 text-slate-400 hover:underline"
              >
                <PiMagicWandBold />
                Suggest starting prompt
              </button>
            )}
            {isRemovableMessage(messages, index) && (
              <button
                onClick={() => onRemoveMessage(index)}
                className="flex h-7 w-7 items-center justify-center rounded-lg p-0.5 transition-colors hover:bg-slate-100 hover:shadow-sm"
                title="Remove message"
              >
                <PiTrashBold className="text-slate-700" />
              </button>
            )}
          </div>
          <PromptBox
            value={
              typeof message.content === "string"
                ? message.content
                : JSON.stringify(message.content)
            }
            onChange={(content) => onMessageChange(index, content)}
            onVariableCreate={onVariableCreate}
            contextText={""} // TODO: Add context for better auto-complete
            variables={variables}
          />
        </div>
      ))}

      <div className="flex flex-row gap-4">
        <button
          onClick={onAddMessagePair}
          disabled={!canAddPair}
          className={`flex flex-row items-center gap-2 ${
            canAddPair
              ? "text-heliblue hover:underline"
              : "cursor-not-allowed text-slate-400"
          }`}
        >
          <PiDiceTwoBold />
          Add Message Pair
        </button>
        {canAddPrefill && (
          <button
            onClick={onAddPrefill}
            disabled={!canAddPrefillMsg}
            className={`flex flex-row items-center gap-2 ${
              canAddPrefillMsg
                ? "text-emerald-400 hover:underline"
                : "cursor-not-allowed text-slate-400"
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
