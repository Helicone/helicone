import { useEffect, useState } from "react";
import ThemedDrawer from "../../../shared/themed/themedDrawer";
import HcButton from "../../../ui/hcButton";
import { BookOpenIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import {
  usePrompt,
  usePromptVersions,
} from "../../../../services/hooks/prompts/prompts";
import { Chat } from "../../requests/chat";
import { Select, SelectItem } from "@tremor/react";
import { useInputs } from "../../../../services/hooks/prompts/inputs";

interface ViewPromptButtonProps {
  promptId: string;
}

const ViewPromptButton = (props: ViewPromptButtonProps) => {
  const { promptId } = props;
  const [promptOpen, setPromptOpen] = useState(false);

  const { prompt, isLoading } = usePrompt(promptId);
  const { prompts } = usePromptVersions(promptId);

  const sortedPrompts = prompts?.sort((a, b) => {
    if (a.major_version === b.major_version) {
      return b.minor_version - a.minor_version;
    }
    return b.major_version - a.major_version;
  });

  const [selectedVersion, setSelectedVersion] = useState<string>(
    `${sortedPrompts?.at(0)?.major_version}.${
      sortedPrompts?.at(0)?.minor_version
    }`
  );

  useEffect(() => {
    if (sortedPrompts?.length) {
      setSelectedVersion(
        `${sortedPrompts[0].major_version}.${sortedPrompts[0].minor_version}`
      );
    }
  }, [sortedPrompts]);

  const selectedPrompt = prompts?.find(
    (p) =>
      p.major_version === parseInt(selectedVersion.split(".")[0]) &&
      p.minor_version === parseInt(selectedVersion.split(".")[1])
  );

  const { inputs } = useInputs(selectedPrompt?.id);

  return (
    <>
      <HcButton
        onClick={() => setPromptOpen(true)}
        variant={"secondary"}
        size={"sm"}
        title="View Prompt"
        icon={BookOpenIcon}
      />

      <ThemedDrawer
        open={promptOpen}
        setOpen={setPromptOpen}
        defaultExpanded={true}
      >
        <div>
          {inputs?.length}
          {inputs?.map((input) => (
            <div key={input.id} className="p-4">
              {JSON.stringify(input.inputs)}
              {input.source_request}
            </div>
          ))}
        </div>
        <div className="p-4 flex flex-col space-y-4">
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="h-5 w-5 text-black dark:text-white" />
              <p className="font-semibold text-lg">Prompt</p>
            </div>
            <div className="flex items-center space-x-2 w-full max-w-xs">
              <label className="text-sm text-gray-500">Version:</label>
              <Select
                value={selectedVersion}
                onValueChange={(value) => setSelectedVersion(value)}
              >
                {sortedPrompts?.map((prompt) => (
                  <SelectItem
                    value={`${prompt.major_version}.${prompt.minor_version}`}
                  >
                    {prompt.major_version}.{prompt.minor_version}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
          <Chat
            requestBody={selectedPrompt?.helicone_template}
            responseBody={{}}
            status={200}
            requestId={""}
            model={prompts?.at(0)?.model || "unknown"}
          />
        </div>
      </ThemedDrawer>
    </>
  );
};

export default ViewPromptButton;
