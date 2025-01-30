import { Button } from "@/components/ui/button";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { StateMessage } from "@/types/prompt-state";
import ReactMarkdown from "react-markdown";
import { PiBrainBold } from "react-icons/pi";
import * as hamster from "@/public/lottie/Aniki Hamster.json";
import { parseImprovedMessages } from "@/utils/messages";

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
  messages: StateMessage[];
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
    <div className="h-full min-h-[42rem] w-full flex flex-col gap-4 justify-between items-center">
      {/* Starting View */}
      {!improvement && (
        <div className="flex flex-col justify-center items-center gap-2">
          <p className="text-sm text-secondary max-w-lg text-pretty">
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
            <PiBrainBold className="h-4 w-4 mr-2" />
            Start Auto-Improve
          </Button>
        </div>
      )}

      {/* Thinking View */}
        <div className="w-full flex flex-col gap-2">
          <div
            className={`w-full flex items-center gap-2 ${
              improvement?.content ? "h-64" : "max-h-[42rem]"
            }`}
          >
            <div className="w-full h-full overflow-y-scroll">
              {improvement?.reasoning !== "" ? (
                <ReactMarkdown className="prose prose-sm dark:prose-invert text-secondary">
                  {improvement?.reasoning || ""}
                </ReactMarkdown>
              ) : (
                <p className="text-sm text-secondary">
                  Connecting you with one of our expert hamsters...
                </p>
              )}
            </div>
            {isImproving ? (
              <LoadingAnimation animation={hamster} />
            ) : (
              <div className="w-full"></div>
            )}
          </div>
        </div>
      

      {/* Difference View */}
      {improvement?.content && (
        <div className="flex divide-x divide-slate-200 dark:divide-slate-800">
          {/* Current Version */}
          <div className="flex flex-col gap-4 w-full max-w-[50%] pr-2">
            <h3 className="font-semibold text-red-500">
              V{version} <span className="">(Current)</span>
            </h3>
            <div className="flex flex-col gap-2">
              {messages.map((msg, index) => (
                <MiniMessage
                  key={index}
                  role={msg.role}
                  content={msg.content}
                />
              ))}
            </div>
          </div>

          {/* Suggested Version */}
          <div className="flex flex-col gap-4 w-full max-w-[50%] pl-2">
            <h3 className="font-semibold text-green-500">
              V{version + 1} <span className="">(Suggested)</span>
            </h3>
            <div className="flex flex-col gap-2">
              {parseImprovedMessages(improvement.content).map((msg, index) => (
                <MiniMessage
                  key={index}
                  role={msg.role}
                  content={msg.content}
                />
              ))}
            </div>
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
            className="bg-green-500 dark:bg-green-500 hover:bg-green-500/90 dark:hover:bg-green-500/90"
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
    <h3 className="font-semibold text-sm text-secondary capitalize ">{role}</h3>
    <p className="text-sm whitespace-pre-wrap border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 rounded-lg p-3">
      {content}
    </p>
  </div>
);
