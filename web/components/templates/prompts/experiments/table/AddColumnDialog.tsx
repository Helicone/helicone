import { useOrg } from "@/components/layout/org/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FlaskConicalIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PromptPlayground from "../../id/promptPlayground";
import { useJawnClient } from "@/lib/clients/jawnHook";
import useOnboardingContext, {
  ONBOARDING_STEPS,
} from "@/components/layout/onboardingContext";

// const SCORES = [
//   "Sentiment",
//   "Accuracy",
//   "Contain words",
//   "Shorter than 50 characters",
//   "Is English",
// ];

const AddColumnDialog = ({
  isOpen,
  onOpenChange,
  selectedForkFromPromptVersionId,
  experimentId,
  originalColumnPromptVersionId,
  numberOfExistingPromptVersions,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedForkFromPromptVersionId?: string | null;
  experimentId: string;
  originalColumnPromptVersionId: string;
  numberOfExistingPromptVersions: number;
}) => {
  const [promptVariables, setPromptVariables] = useState<
    {
      original: string;
      heliconeTag: string;
      value: string;
    }[]
  >([]);

  const jawn = useJawnClient();
  const queryClient = useQueryClient();

  const org = useOrg();
  const orgId = org?.currentOrg?.id;

  // Fetch promptVersionTemplateData
  const {
    data: promptVersionTemplateData,
    isLoading,
    error,
  } = useQuery(
    ["promptVersionTemplate", selectedForkFromPromptVersionId],
    async () => {
      if (!selectedForkFromPromptVersionId || !orgId) {
        return null;
      }
      const jawnClient = getJawnClient(orgId);
      const res = await jawnClient.GET("/v1/prompt/version/{promptVersionId}", {
        params: {
          path: {
            promptVersionId: selectedForkFromPromptVersionId,
          },
        },
      });

      return res.data?.data;
    },
    {
      enabled: !!selectedForkFromPromptVersionId && !!orgId,
    }
  );

  const { isOnboardingVisible, currentStep, setCurrentStep } =
    useOnboardingContext();

  useEffect(() => {
    if (
      isOpen &&
      isOnboardingVisible &&
      currentStep === ONBOARDING_STEPS.EXPERIMENTS_ADD.stepNumber &&
      !promptVersionTemplateData
    ) {
      setCurrentStep(ONBOARDING_STEPS.EXPERIMENTS_ADD_CHANGE_PROMPT.stepNumber);
    }
  }, [
    isOpen,
    isOnboardingVisible,
    currentStep,
    promptVersionTemplateData,
    setCurrentStep,
  ]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={
        isOnboardingVisible &&
        currentStep ===
          ONBOARDING_STEPS.EXPERIMENTS_ADD_CHANGE_PROMPT.stepNumber
          ? undefined
          : onOpenChange
      }
    >
      <DialogContent className="w-[95vw] max-w-2xl gap-0 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <FlaskConicalIcon className="w-5 h-5 mr-2.5 text-slate-500" />
            <h3 className="text-base font-medium text-slate-950 dark:text-white mr-3">
              Add Prompt
            </h3>
            <div className="flex gap-1 items-center">
              <p className="text-slate-500 text-sm font-medium leading-4">
                Forked from
              </p>
              <Badge variant="helicone" className="text-slate-500">
                <FlaskConicalIcon className="w-3.5 h-3.5 mr-1" />
                {(promptVersionTemplateData?.metadata?.label as string) ??
                  `v${promptVersionTemplateData?.major_version}.${promptVersionTemplateData?.minor_version}`}
              </Badge>
            </div>
          </div>
        </div>

        {promptVersionTemplateData && (
          <PromptPlayground
            defaultEditMode={true}
            prompt={promptVersionTemplateData?.helicone_template ?? ""}
            selectedInput={undefined}
            onExtractPromptVariables={(promptInputKeys) => {
              setPromptVariables(promptInputKeys);
            }}
            className="border rounded-md border-slate-200 dark:border-slate-700"
            onSubmit={async (history, model) => {
              const promptData = {
                model: model,
                messages: history.map((msg) => {
                  if (typeof msg === "string") {
                    return msg;
                  }
                  return {
                    role: msg.role,
                    content: [
                      {
                        text: msg.content,
                        type: "text",
                      },
                    ],
                  };
                }),
              };

              const result = await jawn.POST(
                // "/v1/prompt/version/{promptVersionId}/subversion",
                "/v2/experiment/{experimentId}/prompt-version",
                {
                  params: {
                    path: {
                      experimentId: experimentId,
                    },
                  },
                  body: {
                    newHeliconeTemplate: JSON.stringify(promptData),
                    isMajorVersion: false,
                    experimentId: experimentId,
                    parentPromptVersionId:
                      selectedForkFromPromptVersionId ?? "",
                    bumpForMajorPromptVersionId: originalColumnPromptVersionId, // TODO: this will change based on other things later
                    metadata: {
                      label: `Prompt ${numberOfExistingPromptVersions + 1}`,
                    },
                  },
                }
              );

              queryClient.invalidateQueries({
                queryKey: ["experimentPromptVersions", orgId, experimentId],
              });
              queryClient.invalidateQueries({
                queryKey: ["experimentInputKeys", orgId, experimentId],
              });

              if (result.error || !result.data) {
                console.error(result);
                return;
              }

              onOpenChange(false);
            }}
            submitText="Test"
            initialModel={promptVersionTemplateData?.model ?? "gpt-4o"}
            editMode={false}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddColumnDialog;
