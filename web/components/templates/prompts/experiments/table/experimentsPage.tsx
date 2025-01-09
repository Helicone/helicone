import AuthHeader from "../../../../shared/authHeader";
import { useExperimentTables } from "../../../../../services/hooks/prompts/experiments";
import ThemedTable from "../../../../shared/themed/table/themedTable";
import { useRouter } from "next/router";
import { PlusIcon } from "@heroicons/react/24/outline";
import useNotification from "../../../../shared/notification/useNotification";
import { usePrompts } from "../../../../../services/hooks/prompts/prompts";
import { StartFromPromptDialog } from "./components/startFromPromptDialog";
import { Dialog } from "../../../../ui/dialog";
import { useState } from "react";
import { useJawnClient } from "../../../../../lib/clients/jawnHook";
import { getExampleExperimentPrompt } from "./helpers/basePrompt";
import { useOrg } from "@/components/layout/org/organizationContext";
import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const ExperimentsPage = () => {
  const jawn = useJawnClient();
  const notification = useNotification();
  const { prompts } = usePrompts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  const { experiments, isLoading } = useExperimentTables();

  const templateOptions = [
    { id: "text-classification", name: "Text classification" },
    { id: "knowledge-retrieval", name: "Knowledge retrieval" },
    { id: "step-by-step", name: "Step-by-step instructions" },
  ];

  const handleStartFromScratch = async () => {
    const exampleExperimentPrompt = getExampleExperimentPrompt();
    const res = await jawn.POST("/v1/prompt/create", {
      body: {
        userDefinedId: exampleExperimentPrompt.promptName,
        prompt: exampleExperimentPrompt.basePrompt,
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
        newHeliconeTemplate: JSON.stringify(exampleExperimentPrompt.basePrompt),
        isMajorVersion: false,
        promptSubversionMetadata: {
          experimentAssigned: true,
        },
        experimentMetadata: {
          prompt_id: res.data?.data?.id!,
          prompt_version: res.data?.data?.prompt_version_id!,
          experiment_name: `${exampleExperimentPrompt.promptName}_V1.0` || "",
        },
        experimentTableMetadata: {
          datasetId: dataset.data?.data?.datasetId!,
          model: exampleExperimentPrompt.basePrompt.model,
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

  const org = useOrg();

  const { setNotification } = useNotification();

  return (
    <>
      <AuthHeader
        title={"Experiments"}
        actions={
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button>
                <PlusIcon className="w-4 h-4 mr-2" />
                New experiment
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onSelect={async () => {
                  setNotification("Creating experiment...", "info");
                  const res = await jawn.POST("/v2/experiment/create/empty");
                  if (res.error) {
                    notification.setNotification(
                      "Failed to create experiment",
                      "error"
                    );
                  } else {
                    router.push(`/experiments/${res.data?.data?.experimentId}`);
                  }
                }}
              >
                Start from scratch
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
                Start from prompt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <StartFromPromptDialog
          prompts={prompts as any}
          onDialogClose={() => setDialogOpen(false)}
        />
      </Dialog>

      {org?.currentOrg?.tier === "free" ? (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <FeatureUpgradeCard
            title="Unlock Experiments"
            description="The Free plan does not include the Experiments feature, but getting access is easy."
            infoBoxText="You will be charged the cost of the LLM calls made in your experiments." // TODO: change copy
            documentationLink="https://docs.helicone.ai/features/experiments"
            tier={org?.currentOrg?.tier ?? "free"}
          />
        </div>
      ) : (
        <>
          <ThemedTable
            defaultColumns={[
              {
                header: "Name",
                accessorFn: (row) => {
                  return row.name;
                },
              },
              {
                header: "Created At",
                accessorKey: "created_at",
                minSize: 100,
                accessorFn: (row) => {
                  return new Date(row.created_at ?? 0).toLocaleString();
                },
              },
            ]}
            defaultData={experiments}
            dataLoading={isLoading}
            id="experiments"
            skeletonLoading={false}
            onRowSelect={(row) => {
              const promptId = row.original_prompt_version;
              if (promptId) {
                router.push(`/experiments/${row.id}`);
              }
            }}
            fullWidth={true}
          />
        </>
      )}
    </>
  );
};

export default ExperimentsPage;
