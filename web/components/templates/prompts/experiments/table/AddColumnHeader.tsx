import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PromptPlayground from "../../id/promptPlayground";
import { Wand2Icon, XIcon } from "lucide-react";
import { Card } from "@/components/layout/common";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "../../../../ui/scroll-area";
import { useExperimentsStore } from "@/store/store";
import { useQuery } from "@tanstack/react-query";
import { getJawnClient } from "@/lib/clients/jawn";
import { useOrg } from "@/components/layout/organizationContext";
import useOnboardingContext, {
  ONBOARDING_STEPS,
} from "@/components/layout/onboardingContext";
import OnboardingPopover from "@/components/templates/onboarding/OnboardingPopover";

interface AddColumnHeaderProps {
  promptVersionId: string;
  experimentId: string;
  selectedProviderKey: string | null;
  handleAddColumn: (
    columnName: string,
    columnType: "experiment" | "input" | "output",
    hypothesisId?: string,
    promptVersionId?: string
  ) => Promise<void>;
  wrapText: boolean;
}

const SCORES = [
  "Sentiment",
  "Accuracy",
  "Contain words",
  "Shorter than 50 characters",
  "Is English",
];

const AddColumnHeader: React.FC<AddColumnHeaderProps> = ({
  promptVersionId,
  experimentId,
  selectedProviderKey,
  handleAddColumn,
  wrapText,
}) => {
  const { openAddExperimentModal, setOpenAddExperimentModal } =
    useExperimentsStore();
  const [isOpen, setIsOpen] = useState(openAddExperimentModal);
  const jawn = useJawnClient();

  const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);
  const [scoreCriterias, setScoreCriterias] = useState<
    {
      scoreType?: (typeof SCORES)[number];
      criteria?: string;
    }[]
  >([]);

  const org = useOrg();
  const orgId = org?.currentOrg?.id;

  // Fetch promptVersionTemplateData
  const {
    data: promptVersionTemplateData,
    isLoading,
    error,
  } = useQuery(
    ["promptVersionTemplate", promptVersionId],
    async () => {
      if (!promptVersionId || !orgId) {
        return null;
      }
      const jawnClient = getJawnClient(orgId);
      const res = await jawnClient.GET("/v1/prompt/version/{promptVersionId}", {
        params: {
          path: {
            promptVersionId: promptVersionId,
          },
        },
      });
      return res.data?.data;
    },
    {
      enabled: !!promptVersionId && !!orgId,
    }
  );

  const { isOnboardingVisible, currentStep } = useOnboardingContext();

  // Handle loading or error states if necessary
  if (isLoading) {
    return null; // Or a loading indicator
  }

  if (error) {
    console.error("Error fetching prompt version template:", error);
    return null; // Or render an error message
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    setOpenAddExperimentModal(open);
  };

  return (
    <Popover
      open={
        isOpen ||
        (isOnboardingVisible &&
          currentStep ===
            ONBOARDING_STEPS.EXPERIMENTS_ADD_CHANGE_PROMPT.stepNumber)
      }
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger>
        <Popover
          open={
            isOnboardingVisible &&
            currentStep === ONBOARDING_STEPS.EXPERIMENTS_ADD.stepNumber
          }
        >
          <PopoverTrigger>
            <button
              className="p-1 text-gray-500 hover:text-gray-700 flex flex-row items-center space-x-2"
              data-onboarding-step={ONBOARDING_STEPS.EXPERIMENTS_ADD.stepNumber}
            >
              <PlusIcon className="w-5 h-5 text-slate-700" />
              <span className="text-sm font-medium text-slate-700">
                Add Experiment
              </span>
            </button>
          </PopoverTrigger>
          <OnboardingPopover
            onboardingStep="EXPERIMENTS_ADD"
            align="center"
            side="bottom"
          />
        </Popover>
      </PopoverTrigger>

      <PopoverContent className="w-[700px] p-4 bg-white" align="end">
        <ScrollArea
          className="flex flex-col overflow-y-auto max-h-[700px]"
          viewportId="add-experiment-scroll-area"
        >
          <div className="space-y-4">
            <h3 className="font-semibold">Add New Experiment</h3>
            {showSuggestionPanel && (
              <Card className="bg-gray-50 border border-slate-200 py-2 px-4 rounded-md text-slate-900 mb-2">
                <CardHeader className="flex flex-row items-center justify-between p-0">
                  <div className="flex gap-2 items-center text-slate-900 font-medium">
                    <Wand2Icon className="w-4 h-4" />
                    Give me a suggestion
                  </div>
                  <Button variant="ghost" size="icon">
                    <XIcon
                      className="w-4 h-4"
                      onClick={() => setShowSuggestionPanel(false)}
                    />
                  </Button>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {scoreCriterias.map((criteria, index) => (
                    <div className="flex gap-2 items-center" key={index}>
                      <Select
                        value={criteria.scoreType}
                        onValueChange={(value) => {
                          setScoreCriterias(
                            scoreCriterias.map((c) =>
                              c.scoreType === criteria.scoreType
                                ? { ...c, scoreType: value }
                                : c
                            )
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {SCORES.filter(
                            (score) =>
                              !scoreCriterias.some(
                                (c) => c.scoreType === score
                              ) || criteria.scoreType === score
                          ).map((score) => (
                            <SelectItem key={score} value={score}>
                              {score}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs font-semibold text-gray-400">IS</p>
                      <Input
                        placeholder="Type"
                        className="w-24"
                        value={criteria.criteria}
                        onChange={(e) => {
                          setScoreCriterias(
                            scoreCriterias.map((c) =>
                              c.scoreType === criteria.scoreType
                                ? { ...c, criteria: e.target.value }
                                : c
                            )
                          );
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="border border-slate-200 aspect-square"
                      >
                        <XIcon
                          className="w-4 h-4"
                          onClick={() => {
                            setScoreCriterias(
                              scoreCriterias.filter(
                                (c) => c.scoreType !== criteria.scoreType
                              )
                            );
                          }}
                        />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    className="mt-2 border border-slate-200 self-start"
                    onClick={() => {
                      setScoreCriterias([
                        ...scoreCriterias,
                        { scoreType: undefined, criteria: "" },
                      ]);
                    }}
                  >
                    <PlusIcon className="w-4 h-4" /> Add criteria
                  </Button>
                </CardContent>
                {scoreCriterias.length > 0 &&
                  scoreCriterias.every((c) => c.scoreType && c.criteria) && (
                    <CardFooter>
                      <Button className="flex items-center gap-2 w-full">
                        <Wand2Icon className="w-4 h-4" />
                        Suggest a prompt
                      </Button>
                    </CardFooter>
                  )}
              </Card>
            )}
            {!showSuggestionPanel && (
              <Button
                variant="ghost"
                onClick={() => setShowSuggestionPanel(true)}
                className="flex items-center gap-2 bg-gray-50 text-slate-900 mb-4"
              >
                <Wand2Icon className="w-4 h-4" />
                Give me a suggestion
              </Button>
            )}
            <PromptPlayground
              defaultEditMode={true}
              prompt={promptVersionTemplateData?.helicone_template ?? ""}
              selectedInput={undefined}
              onSubmit={async (history, model) => {
                const promptData = {
                  model: model,
                  messages: history.map((msg) => ({
                    role: msg.role,
                    content: [
                      {
                        text: msg.content,
                        type: "text",
                      },
                    ],
                  })),
                };

                const result = await jawn.POST(
                  "/v1/prompt/version/{promptVersionId}/subversion",
                  {
                    params: {
                      path: {
                        promptVersionId: promptVersionId,
                      },
                    },
                    body: {
                      newHeliconeTemplate: JSON.stringify(promptData),
                      isMajorVersion: false,
                    },
                  }
                );

                if (result.error || !result.data) {
                  console.error(result);
                  return;
                }

                const hypothesisResult = await jawn.POST(
                  "/v1/experiment/hypothesis",
                  {
                    body: {
                      experimentId: experimentId,
                      model: model,
                      promptVersion: result.data.data?.id ?? "",
                      providerKeyId: "NOKEY",
                      status: "RUNNING",
                    },
                  }
                );
                if (hypothesisResult.error || !hypothesisResult.data) {
                  console.error(hypothesisResult);
                  return;
                }

                await handleAddColumn(
                  "Experiment",
                  "experiment",
                  hypothesisResult.data.data?.hypothesisId,
                  result.data.data?.id
                );

                setOpenAddExperimentModal(false);
                setIsOpen(false);
              }}
              submitText="Test"
              initialModel={"gpt-4o"}
              editMode={false}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setOpenAddExperimentModal(false)}>
              Close
            </Button>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default AddColumnHeader;
