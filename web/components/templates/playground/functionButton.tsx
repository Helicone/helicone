import { useState } from "react";
import ThemedModal from "../../shared/themed/themedModal";
import MarkdownEditor from "../../shared/markdownEditor";
import ReactJson from "react-json-view";
import HcButton from "../../ui/hcButton";
import { TrashIcon } from "@heroicons/react/24/outline";

interface FunctionButtonProps {
  tool: any;
  onSave: (functionText: string) => void;
  onDelete: (name: string) => void;
  //   setTool: (tool: any) => void;
}

const FunctionButton = (props: FunctionButtonProps) => {
  const { tool, onSave, onDelete } = props;

  const [open, setOpen] = useState(false);
  const [functionText, setFunctionText] = useState(
    JSON.stringify(tool.function, null, 2)
  );

  const getName = (tool: any) => {
    try {
      return tool.function.name;
    } catch (e) {
      return "n/a";
    }
  };

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
      <div className="w-full justify-between flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          className="text-xs flex items-center space-x-1 bg-white border border-gray-300 dark:bg-black dark:border-gray-700 rounded-lg py-1 px-2 w-fit hover:cursor-pointer"
        >
          <i className="text-gray-500">function</i>
          <p
            style={{
              // mono
              fontFamily: "monospace",
            }}
            className="text-black dark:text-white font-semibold truncate w-40"
          >
            {getName(tool)}
          </p>
        </button>
        <button onClick={() => onDelete(getName(tool))} className="">
          <TrashIcon className="h-4 w-4 text-red-500" />
        </button>
      </div>

      <ThemedModal open={open} setOpen={setOpen}>
        <div className="w-[600px] h-full flex flex-col space-y-4">
          <h3 className="text-xl font-semibold">Function Details</h3>

          <MarkdownEditor text={functionText} setText={setFunctionText} />
          <div className="flex w-full justify-end items-center gap-2">
            {!isValidJson(functionText) && (
              <p className="text-red-500 text-sm">Invalid JSON</p>
            )}
            <HcButton
              variant={"primary"}
              size={"sm"}
              title={"Save"}
              disabled={!isValidJson(functionText)}
              onClick={() => {
                onSave(functionText);
                setFunctionText(functionText);
              }}
            />
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export default FunctionButton;
