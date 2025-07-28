import LoadingAnimation from "@/components/shared/loadingAnimation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "@helicone-package/llm-mapper/types";
import { parseImprovedMessages } from "@/utils/messages";
import { PiBrainBold } from "react-icons/pi";
import ReactMarkdown from "react-markdown";

interface Improvement {
  content: string;
  reasoning: string;
}

type StateUpdate = {
  improvement?: Improvement;
};

interface AutoImproveProps {
  isImproving: boolean;
  improvement?: Improvement;
  version: number;
  messages: Message[];
  onStartImprove: () => void;
  onApplyImprovement: () => void;
  onCancel: () => void;
  updateState: (updates: StateUpdate) => void;
}

export default function AutoImprove({
  isImproving,
  improvement,
  version,
  messages,
  onStartImprove,
  onApplyImprovement,
  onCancel,
  updateState,
}: AutoImproveProps) {
  return (
    <div className="flex h-full min-h-[42rem] w-full flex-col items-center justify-between gap-4 p-4">
      {/* Starting View */}
      {!improvement && (
        <div className="flex flex-col items-center justify-center gap-4">
          <p className="max-w-lg text-pretty text-center text-sm text-secondary">
            <span className="font-semibold">Auto-Improve</span> will read your
            prompt to understand how it comes off now vs its instructional
            intent. Then it will suggest improvements to get it closer to its
            full potential.
          </p>
          <Button
            variant="action"
            onClick={() => {
              updateState({ improvement: { content: "", reasoning: "" } });
              onStartImprove();
            }}
            className="w-fit"
            disabled={isImproving}
          >
            <PiBrainBold className="mr-2 h-4 w-4" />
            Start Auto-Improve
          </Button>
        </div>
      )}

      {/* Thinking View */}
      <div className="flex w-full flex-col gap-2">
        <div
          className={`flex w-full items-center gap-2 ${
            improvement?.content ? "h-64" : "max-h-[42rem]"
          }`}
        >
          <ScrollArea className="h-full w-full text-center">
            {improvement?.reasoning !== "" ? (
              <ReactMarkdown className="prose prose-sm text-secondary dark:prose-invert">
                {improvement?.reasoning || ""}
              </ReactMarkdown>
            ) : (
              <p className="text-sm text-secondary">
                Connecting you with our systems...
              </p>
            )}
          </ScrollArea>
          {isImproving ? <LoadingAnimation /> : <div className="w-full"></div>}
        </div>
      </div>

      {/* Difference View */}
      {improvement?.content && (
        <div className="flex h-full divide-x divide-slate-200 dark:divide-slate-800">
          {/* Current Version */}
          <div className="flex w-full max-w-[50%] flex-col gap-4 pr-2">
            <h3 className="font-semibold text-red-500">
              V{version} <span className="">(Current)</span>
            </h3>
            <ScrollArea className="h-96">
              <div className="flex flex-col gap-2">
                {messages.map((msg, index) => (
                  <MiniMessage
                    key={index}
                    role={msg.role || ""}
                    content={msg.content || ""}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Suggested Version */}
          <div className="flex w-full max-w-[50%] flex-col gap-4 pl-2">
            <h3 className="font-semibold text-green-500">
              V{version + 1} <span className="">(Suggested)</span>
            </h3>
            <ScrollArea className="h-96">
              <div className="flex flex-col gap-2">
                {parseImprovedMessages(improvement.content).map(
                  (msg, index) => (
                    <MiniMessage
                      key={index}
                      role={msg.role || ""}
                      content={msg.content || ""}
                    />
                  ),
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Actions */}
      {improvement && !isImproving && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="bg-green-500 hover:bg-green-500/90 dark:bg-green-500 dark:hover:bg-green-500/90"
            onClick={onApplyImprovement}
          >
            Save Suggested Version
          </Button>
        </div>
      )}
    </div>
  );
}

const MiniMessage = ({ role, content }: { role: string; content: string }) => (
  <div className="flex flex-col gap-1">
    <h3 className="text-sm font-semibold capitalize text-secondary">{role}</h3>
    <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-100 p-3 text-sm dark:border-slate-800 dark:bg-slate-900">
      {content}
    </p>
  </div>
);
