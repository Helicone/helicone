import { useState } from "react";
import { PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { BeakerIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import PromptPlayground, { PromptObject } from "../../../id/promptPlayground";
import { Input as PromptInput } from "../../../id/MessageInput";
import useNotification from "../../../../../shared/notification/useNotification";
import { useJawnClient } from "../../../../../../lib/clients/jawnHook";

export const NewExperimentPopover = () => {
  const notification = useNotification();
  const jawn = useJawnClient();
  const [basePrompt, setBasePrompt] = useState<PromptObject>({
    model: "gpt-4",
    messages: [
      {
        id: "1",
        role: "system",
        content: "You are a helpful assistant.",
        _type: "message",
      },
    ],
  });

  const router = useRouter();

  const [selectedInput, setSelectedInput] = useState<PromptInput>({
    id: "",
    inputs: {},
    source_request: "",
    prompt_version: "",
    created_at: "",
    auto_prompt_inputs: [],
    response_body: "",
  });

  const [promptName, setPromptName] = useState<string>("");
  const [promptVariables, setPromptVariables] = useState<
    Array<{ original: string; heliconeTag: string; value: string }>
  >([]);

  const [inputs, setInputs] = useState<{ variable: string; value: string }[]>([
    { variable: "sectionTitle", value: "The universe" },
  ]);

  const handleInputChange = (
    index: number,
    field: "variable" | "value",
    newValue: string
  ) => {
    const newInputs = [...inputs];
    newInputs[index][field] = newValue;
    setInputs(newInputs);
  };

  const addNewInput = () => {
    setInputs([...inputs, { variable: "", value: "" }]);
  };

  const handlePromptChange = (newPrompt: string | PromptObject) => {
    setBasePrompt(newPrompt as PromptObject);
  };

  const handleCreateExperiment = async () => {
    if (!promptName || !basePrompt) {
      notification.setNotification(
        "Please enter a prompt name and content",
        "error"
      );
      return;
    }

    if (!basePrompt.model) {
      notification.setNotification("Please select a model", "error");
      return;
    }

    const res = await jawn.POST("/v1/prompt/create", {
      body: {
        userDefinedId: promptName,
        prompt: basePrompt,
        metadata: {
          createdFromUi: true,
        },
      },
    });
    if (res.error || !res.data) {
      notification.setNotification("Failed to create prompt", "error");
      return;
    }

    if (!res.data?.data?.id || !res.data?.data?.prompt_version_id) {
      notification.setNotification("Failed to create prompt", "error");
      return;
    }

    const dataset = await jawn.POST("/v1/helicone-dataset", {
      body: {
        datasetName: "Dataset for Experiment",
        requestIds: [],
      },
    });
    if (!dataset.data?.data?.datasetId) {
      notification.setNotification("Failed to create dataset", "error");
      return;
    }

    const experimentTableResult = await jawn.POST("/v1/experiment/table/new", {
      body: {
        datasetId: dataset.data?.data?.datasetId!,
        promptVersionId: res.data?.data?.prompt_version_id!,
        newHeliconeTemplate: JSON.stringify(basePrompt),
        isMajorVersion: false,
        promptSubversionMetadata: {
          experimentAssigned: true,
        },
        experimentMetadata: {
          prompt_id: res.data?.data?.id!,
          prompt_version: res.data?.data?.prompt_version_id!,
          experiment_name: `${promptName}_V1.0` || "",
        },
        experimentTableMetadata: {
          datasetId: dataset.data?.data?.datasetId!,
          model: basePrompt.model,
          prompt_id: res.data?.data?.id!,
          prompt_version: res.data?.data?.prompt_version_id!,
        },
      },
    });
    if (!experimentTableResult.data?.data?.experimentId) {
      notification.setNotification("Failed to create experiment", "error");
      return;
    }

    await router.push(
      `/experiments/${experimentTableResult.data?.data?.tableId}`
    );
  };

  return (
    <PopoverContent
      className="w-[600px] p-4 bg-white shadow-lg rounded-md"
      side="bottom"
      align="start"
    >
      <ScrollArea className="flex flex-col overflow-y-auto max-h-[700px] ">
        <div className="space-y-4">
          <div className="flex flex-row space-x-2 ">
            <BeakerIcon className="h-6 w-6" />
            <h3 className="text-md font-semibold">Original Prompt</h3>
          </div>
          <Input
            placeholder="Prompt Name"
            value={promptName}
            onChange={(e) => setPromptName(e.target.value)}
          />
          <PromptPlayground
            prompt={basePrompt}
            editMode={true}
            selectedInput={selectedInput}
            defaultEditMode={true}
            submitText={"Create Experiment"}
            playgroundMode={"experiment"}
            handleCreateExperiment={handleCreateExperiment}
            isPromptCreatedFromUi={true}
            onExtractPromptVariables={(variables) =>
              setPromptVariables(
                variables.map((variable) => ({
                  original: variable.original,
                  heliconeTag: variable.heliconeTag,
                  value: variable.value,
                }))
              )
            }
            onPromptChange={handlePromptChange}
          />
        </div>
      </ScrollArea>
    </PopoverContent>
  );
};
