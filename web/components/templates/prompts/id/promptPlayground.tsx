import React, { useState } from "react";
import { TextInput, Select, SelectItem } from "@tremor/react";
import { RenderImageWithPrettyInputKeys } from "./promptIdPage";
import HcButton from "../../../ui/hcButton";

type Input = {
  id: string;
  source_request: string;
  created_at: string;
  inputs: Record<string, string>;
  auto_prompt_inputs?: Record<string, string>;
  response_body?: any;
};

interface PromptPlaygroundProps {
  prompt: string | undefined;
  inputs: Input[] | undefined;
  selectedInput: Input | undefined;
  onInputSelect: (input: Input | undefined) => void;
}

const PromptPlayground: React.FC<PromptPlaygroundProps> = ({
  prompt,
  inputs,
  selectedInput,
  onInputSelect,
}) => {
  const [editedPrompt, setEditedPrompt] = useState(prompt || "");
  const [searchRequestId, setSearchRequestId] = useState("");

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedPrompt(e.target.value);
  };

  return (
    <div className="flex flex-row space-x-4 h-[75vh]">
      <div className="w-2/3 flex flex-col space-y-4">
        <h2 className="text-xl font-semibold">Edit Prompt</h2>
        <textarea
          value={editedPrompt}
          onChange={handlePromptChange}
          className="w-full h-full p-4 border rounded-md resize-none"
          placeholder="Enter your prompt here..."
        />
        <HcButton
          variant="primary"
          size="sm"
          title="Save Changes"
          onClick={() => {
            // Implement save functionality here
            console.log("Saving prompt:", editedPrompt);
          }}
        />
      </div>
      <div className="w-1/3 flex flex-col space-y-4">
        <h2 className="text-xl font-semibold">Inputs</h2>
        <TextInput
          placeholder="Search by request id..."
          value={searchRequestId}
          onValueChange={setSearchRequestId}
        />
        <Select
          value={selectedInput?.id || ""}
          onValueChange={(value) => {
            const input = inputs?.find((i) => i.id === value);
            onInputSelect(input);
          }}
        >
          {inputs
            ?.filter((input) => input.source_request.includes(searchRequestId))
            .map((input) => (
              <SelectItem key={input.id} value={input.id}>
                {input.source_request}
              </SelectItem>
            ))}
        </Select>
        {selectedInput && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Selected Input</h3>
            <RenderImageWithPrettyInputKeys
              text={editedPrompt}
              selectedProperties={selectedInput.inputs}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptPlayground;
