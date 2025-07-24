import { Button } from "@/components/ui/button";
import { TrashIcon } from "@heroicons/react/24/outline";
import { ChatCompletionTool } from "openai/resources";
import { useState } from "react";
import MarkdownEditor from "../../shared/markdownEditor";
import ThemedModal from "../../shared/themed/themedModal";

interface FunctionButtonProps {
  tool: ChatCompletionTool;
  onSave: (functionText: string) => void;
  onDelete: (name: string) => void;
}

const FunctionButton = (props: FunctionButtonProps) => {
  const { tool, onSave, onDelete } = props;

  const [open, setOpen] = useState(false);
  const [functionText, setFunctionText] = useState(
    tool.function ? JSON.stringify(tool.function, null, 2) : "{}",
  );

  const isValidJson = (jsonString: string) => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <>
      <div className="flex w-full items-center justify-between gap-2">
        <button
          onClick={() => setOpen(true)}
          className="flex w-fit items-center space-x-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs hover:cursor-pointer dark:border-gray-700 dark:bg-black"
        >
          <i className="text-gray-500">function</i>
          <p
            style={{
              // mono
              fontFamily: "monospace",
            }}
            className="w-40 truncate font-semibold text-black dark:text-white"
          >
            {tool?.function?.name || "n/a"}
          </p>
        </button>
        <button
          onClick={() => onDelete(tool?.function?.name || "")}
          className=""
        >
          <TrashIcon className="h-4 w-4 text-red-500" />
        </button>
      </div>

      <ThemedModal open={open} setOpen={setOpen}>
        <div className="flex h-full w-[600px] flex-col space-y-4">
          <h3 className="text-xl font-semibold">Function Details</h3>

          <MarkdownEditor
            text={functionText}
            setText={setFunctionText}
            language="json"
          />
          <div className="flex w-full items-center justify-end gap-2">
            {!isValidJson(functionText) && (
              <p className="text-sm text-red-500">Invalid JSON</p>
            )}
            <Button
              size={"sm"}
              disabled={!isValidJson(functionText)}
              onClick={() => {
                onSave(functionText);
                setFunctionText(functionText);
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export default FunctionButton;
