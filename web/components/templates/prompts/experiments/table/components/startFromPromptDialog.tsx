import { usePromptVersions } from "../../../../../../services/hooks/prompts/prompts";
import { useState } from "react";
import { Select, SelectContent, SelectItem } from "../../../../../ui/select";
import { ScrollArea } from "../../../../../ui/scroll-area";
import { SelectTrigger, SelectValue } from "../../../../../ui/select";
import { Button } from "../../../../../ui/button";
import { FileTextIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "../../../../../ui/dialog";
import { BeakerIcon, PlusIcon } from "@heroicons/react/24/outline";
import useNotification from "../../../../../shared/notification/useNotification";
import { useJawnClient } from "../../../../../../lib/clients/jawnHook";
import { useRouter } from "next/router";
import PromptPlayground, { PromptObject } from "../../../id/promptPlayground";
import { Input } from "../../../../../ui/input";
import LoadingAnimation from "../../../../../shared/loadingAnimation";

export const NewExperimentDialog = () => {
  const notification = useNotification();
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
  const jawn = useJawnClient();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [promptName, setPromptName] = useState<string>("");

  const handlePromptChange = (newPrompt: string | PromptObject) => {
    setBasePrompt(newPrompt as PromptObject);
  };

  const handleCreateExperiment = async () => {
    setIsLoading(true);
    if (!promptName || !basePrompt) {
      notification.setNotification(
        "Please enter a prompt name and content",
        "error",
      );
      setIsLoading(false);
      return;
    }

    if (!basePrompt.model) {
      notification.setNotification("Please select a model", "error");
      setIsLoading(false);
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
      setIsLoading(false);
      return;
    }

    if (!res.data?.data?.id || !res.data?.data?.prompt_version_id) {
      notification.setNotification("Failed to create prompt", "error");
      setIsLoading(false);
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
      setIsLoading(false);
      return;
    }

    const experiment = await jawn.POST("/v1/experiment/new-empty", {
      body: {
        metadata: {
          prompt_id: res.data?.data?.id!,
          prompt_version: res.data?.data?.prompt_version_id!,
          experiment_name: `${promptName}_V1.0` || "",
        },
        datasetId: dataset.data?.data?.datasetId,
      },
    });
    if (!experiment.data?.data?.experimentId) {
      notification.setNotification("Failed to create experiment", "error");
      setIsLoading(false);
      return;
    }
    const result = await jawn.POST(
      "/v1/prompt/version/{promptVersionId}/subversion",
      {
        params: {
          path: {
            promptVersionId: res.data?.data?.prompt_version_id!,
          },
        },
        body: {
          newHeliconeTemplate: JSON.stringify(basePrompt),
          isMajorVersion: false,
          metadata: {
            experimentAssigned: true,
          },
        },
      },
    );

    if (result.error || !result.data) {
      notification.setNotification("Failed to create subversion", "error");
      setIsLoading(false);
      return;
    }

    notification.setNotification("Prompt created successfully", "success");
    setIsLoading(false);
    await router.push(
      `/prompts/${res.data?.data?.id}/subversion/${res.data?.data?.prompt_version_id}/experiment/${experiment.data?.data?.experimentId}`,
    );
  };

  return (
    <DialogContent className="max-h-[80vh] w-full overflow-y-auto">
      {isLoading ? (
        <div className="flex h-full w-full flex-col items-center justify-center">
          <LoadingAnimation />
          <h1 className="text-2xl font-semibold">Getting your experiments</h1>
        </div>
      ) : (
        <div className="space-y-4 pr-8">
          <div className="flex flex-row space-x-2">
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
            onExtractPromptVariables={(variables: any) =>
              setPromptVariables(
                variables.map((variable: any) => ({
                  original: variable.original,
                  heliconeTag: variable.heliconeTag,
                  value: variable.value,
                })),
              )
            }
            onPromptChange={handlePromptChange}
          />
        </div>
      )}
    </DialogContent>
  );
};

interface StartFromPromptDialogProps {
  prompts: {
    id: string;
    user_defined_id: string;
    description: string;
    pretty_name: string;
    created_at: string;
    major_version: number;
    metadata?: Record<string, any>;
  }[];
  onDialogClose: (open: boolean) => void;
}

export const StartFromPromptDialog = ({
  prompts,
  onDialogClose,
}: StartFromPromptDialogProps) => {
  const router = useRouter();
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const notification = useNotification();
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  );
  const jawn = useJawnClient();

  const { prompts: promptVersions, isLoading: isLoadingVersions } =
    usePromptVersions(selectedPromptId ?? "");

  const handlePromptSelect = (promptId: string) => {
    setSelectedPromptId(promptId);
    setSelectedVersionId(null);
  };

  const handleCreateExperiment = async () => {
    if (!selectedPromptId || !selectedVersionId) {
      notification.setNotification(
        "Please select a prompt and version",
        "error",
      );
      return;
    }
    const promptVersion = promptVersions?.find(
      (p) => p.id === selectedVersionId,
    );
    const prompt = prompts?.find((p) => p.id === selectedPromptId);

    const experimentTableResult = await jawn.POST("/v2/experiment/new", {
      body: {
        name: `${prompt?.user_defined_id}_V${promptVersion?.major_version}.${promptVersion?.minor_version}`,
        originalPromptVersion: selectedVersionId,
      },
    });

    if (experimentTableResult.error || !experimentTableResult.data) {
      notification.setNotification("Failed to create experiment", "error");
      return;
    }

    router.push(
      `/experiments/${experimentTableResult.data?.data?.experimentId}`,
    );
  };

  return (
    <DialogContent className="w-[500px] rounded-md p-4 shadow-lg">
      <div>
        <div className="flex flex-row items-center space-x-2 text-center">
          <BeakerIcon className="h-4 w-4" />
          <h3 className="mb-2 text-lg font-medium">Start with a prompt</h3>
        </div>

        <p className="mb-2 text-sm text-slate-500">
          Choose an existing prompt and select the version you want to
          experiment on.
        </p>
        <div className="rounded-md border border-slate-200 dark:border-slate-700">
          <ScrollArea className="flex max-h-[30vh] flex-col overflow-y-auto px-1 py-2 pt-0">
            {prompts &&
              prompts?.map((prompt) => (
                <Button
                  key={prompt.id}
                  variant="ghost"
                  className={`mt-2 w-full justify-start ${
                    selectedPromptId === prompt.id
                      ? "bg-slate-200 dark:bg-slate-800"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => handlePromptSelect(prompt.id)}
                >
                  <FileTextIcon className="mr-2 h-4 w-4" />
                  {prompt.user_defined_id}
                </Button>
              ))}
          </ScrollArea>
          <div className="flex cursor-pointer flex-row items-center space-x-2 border-t border-slate-200 px-4 py-4 dark:border-slate-700">
            <PlusIcon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            <Dialog>
              <DialogTrigger asChild>
                <span className="text-md font-normal text-slate-700 dark:text-slate-300">
                  Create a new prompt
                </span>
              </DialogTrigger>
              <NewExperimentDialog />
            </Dialog>
          </div>
        </div>

        <div className="mt-4 flex flex-row items-center justify-center space-x-2">
          <h4 className="font-semibold">Version</h4>
          <Select
            value={selectedVersionId ?? ""}
            onValueChange={setSelectedVersionId}
          >
            <SelectTrigger>
              <SelectValue
                className="text-xl"
                placeholder={
                  isLoadingVersions
                    ? "Loading versions..."
                    : "Select the version"
                }
              />
            </SelectTrigger>
            <SelectContent className="text-xl">
              {!isLoadingVersions &&
                promptVersions
                  ?.filter((version) => version.minor_version === 0)
                  ?.map((version: any) => (
                    <SelectItem
                      key={version.id}
                      value={version.id}
                      className={`cursor-pointer ${
                        selectedVersionId === version.id
                          ? "bg-accent"
                          : "hover:bg-accent"
                      }`}
                    >
                      {version.name ||
                        `V ${version.major_version}.${version.minor_version}`}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex flex-row items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => onDialogClose(false)}
            className="w-full"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            disabled={!selectedVersionId}
            onClick={handleCreateExperiment}
            className="w-full"
          >
            Create experiment
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};
