import { usePromptVersions } from "../../../../../../services/hooks/prompts/prompts";
import { useState } from "react";
import { Select, SelectContent, SelectItem } from "../../../../../ui/select";
import { ScrollArea } from "../../../../../ui/scroll-area";
import { SelectTrigger, SelectValue } from "../../../../../ui/select";
import { Button } from "../../../../../ui/button";
import { FileTextIcon } from "lucide-react";
import { DialogContent } from "../../../../../ui/dialog";
import { BeakerIcon } from "@heroicons/react/24/outline";
import useNotification from "../../../../../shared/notification/useNotification";
import { useJawnClient } from "../../../../../../lib/clients/jawnHook";
import { useRouter } from "next/router";

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
    null
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
        "error"
      );
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
    const promptVersion = promptVersions?.find(
      (p) => p.id === selectedVersionId
    );
    const prompt = prompts?.find((p) => p.id === selectedPromptId);
    const experiment = await jawn.POST("/v1/experiment/new-empty", {
      body: {
        metadata: {
          prompt_id: selectedPromptId,
          prompt_version: selectedVersionId || "",
          experiment_name:
            `${prompt?.user_defined_id}_V${promptVersion?.major_version}.${promptVersion?.minor_version}` ||
            "",
        },
        datasetId: dataset.data?.data?.datasetId,
      },
    });
    if (!experiment.data?.data?.experimentId) {
      notification.setNotification("Failed to create experiment", "error");
      return;
    }
    const result = await jawn.POST(
      "/v1/prompt/version/{promptVersionId}/subversion",
      {
        params: {
          path: {
            promptVersionId: selectedVersionId,
          },
        },
        body: {
          newHeliconeTemplate: JSON.stringify(promptVersion?.helicone_template),
          isMajorVersion: false,
          metadata: {
            experimentAssigned: true,
          },
        },
      }
    );

    if (result.error || !result.data) {
      notification.setNotification("Failed to create subversion", "error");
      return;
    }

    router.push(
      `/prompts/${selectedPromptId}/subversion/${selectedVersionId}/experiment/${experiment.data?.data?.experimentId}`
    );
  };

  return (
    <DialogContent className="w-[400px] p-4 bg-white shadow-lg rounded-md">
      <div>
        <div className="flex flex-row items-center space-x-2 text-center">
          <BeakerIcon className="w-4 h-4 " />
          <h3 className="font-medium mb-2 text-lg">Start with a prompt</h3>
        </div>

        <p className="text-sm text-gray-500 mb-2">
          Choose an existing prompt and select the version you want to
          experiment on.
        </p>
        <ScrollArea className="flex flex-col overflow-y-auto max-h-[30vh] border border-slate-200 rounded-md p-2 pt-0">
          {prompts &&
            prompts?.map((prompt) => (
              <Button
                key={prompt.id}
                variant="ghost"
                className={`w-full justify-start mt-2 ${
                  selectedPromptId === prompt.id
                    ? "bg-slate-200"
                    : "hover:bg-accent"
                }`}
                onClick={() => handlePromptSelect(prompt.id)}
              >
                <FileTextIcon className="mr-2 h-4 w-4" />
                {prompt.user_defined_id}
              </Button>
            ))}
        </ScrollArea>

        <div className="mt-4 flex flex-row space-x-2 items-center justify-center">
          <h4 className="font-semibold ">Version</h4>
          <Select
            value={selectedVersionId ?? ""}
            onValueChange={setSelectedVersionId}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingVersions
                    ? "Loading versions..."
                    : "Select the version"
                }
              />
            </SelectTrigger>
            <SelectContent className="text-md">
              {!isLoadingVersions &&
                promptVersions?.map((version: any) => (
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

        <div className="mt-4 flex flex-row space-x-2 items-center justify-center">
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
