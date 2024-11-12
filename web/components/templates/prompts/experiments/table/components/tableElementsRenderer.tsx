import {
  ListBulletIcon,
  PlayIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../../../../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../../ui/popover";
import { useState, useCallback, useMemo } from "react";
import PromptPlayground from "../../../id/promptPlayground";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useJawnClient } from "../../../../../../lib/clients/jawnHook";
import useOnboardingContext, {
  ONBOARDING_STEPS,
} from "@/components/layout/onboardingContext";
import { OnboardingPopoverContent } from "@/components/templates/onboarding/OnboardingPopover";
import { Badge } from "@/components/ui/badge";
import React from "react";
import useNotification from "../../../../../shared/notification/useNotification";
import InputEditorDrawer from "./inputEditorDrawer";
import ArrayDiffViewer from "../../../id/arrayDiffViewer";

export interface InputEntry {
  key: string;
  value: string;
}

interface InputCellRendererProps {
  value?: InputEntry[];
  data: any; // The full row data
  context: any; // Grid context
  node: any; // Grid node
}

const InputCellRenderer: React.FC<InputCellRendererProps> = (props) => {
  const notification = useNotification();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Use the inputs from props
  const inputs: InputEntry[] = useMemo(() => {
    const inputValue = props?.data?.cells?.inputs?.value;
    if (Array.isArray(inputValue)) {
      return inputValue;
    } else {
      return [];
    }
  }, [props?.data?.cells?.inputs?.value]);

  // Handle saving inputs from the drawer
  const handleSave = useCallback(
    (updatedInputs: InputEntry[]) => {
      const cellId = props?.data?.cells?.inputs?.cellId;

      // Validate inputs
      const validateInputs = (inputs: InputEntry[]) => {
        return inputs.every((input) => input.key && input.value);
      };

      if (!validateInputs(updatedInputs)) {
        notification.setNotification("Please add valid inputs", "error");
        return;
      }

      try {
        props.context.handleUpdateExperimentCell({
          cellId: cellId,
          value: "inputs",
          metadata: {
            inputs: updatedInputs,
          },
        });
        console.log("handleUpdateExperimentCell called successfully");

        // Update latest input keys
        const latestInputKeys = updatedInputs.map((input) => input.key);
        props.context.updateLatestInputKeys(latestInputKeys);
      } catch (error) {
        console.error("Error calling handleUpdateExperimentCell:", error);
      }
    },
    [props, notification]
  );

  return (
    <>
      <div
        className="cursor-pointer p-2"
        onClick={() => setIsDrawerOpen(true)}
        style={{
          whiteSpace: "normal",
          overflow: "hidden",
          textOverflow: "ellipsis",
          minHeight: "20px",
        }}
      >
        {inputs.length > 0 ? (
          inputs.map((inputEntry, index) => (
            <div key={`${inputEntry.key}-${index}`}>
              <span className="mr-1 font-semibold">{inputEntry.key}:</span>
              <span>{inputEntry.value === "" ? "null" : inputEntry.value}</span>
            </div>
          ))
        ) : (
          <div className="text-gray-500">Click to add inputs</div>
        )}
      </div>

      {/* Render the InputEditorDrawer when isDrawerOpen is true */}
      {isDrawerOpen && (
        <InputEditorDrawer
          open={isDrawerOpen}
          setOpen={setIsDrawerOpen}
          initialInputs={inputs}
          onSave={handleSave}
        />
      )}
    </>
  );
};

const CustomHeaderComponent: React.FC<any> = (props) => {
  const {
    displayName,
    badgeText,
    badgeVariant,
    onRunColumn,
    onHeaderClick,
    orginalPromptTemplate,
    promptVersionId,
    originalPromptTemplate,
  } = props;

  const [showPromptPlayground, setShowPromptPlayground] = useState(false);
  const jawnClient = useJawnClient();

  const { isOnboardingVisible, currentStep } = useOnboardingContext();

  // Use React Query to fetch and cache the prompt template
  const { data: promptTemplate, isLoading: isPromptTemplateLoading } = useQuery(
    ["promptTemplate", promptVersionId],
    async () => {
      if (!props.context.orgId || !promptVersionId) return null;

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
      enabled:
        !!props.context.orgId &&
        !!promptVersionId &&
        (showPromptPlayground ||
          (isOnboardingVisible &&
            currentStep === ONBOARDING_STEPS.EXPERIMENTS_ORIGINAL.stepNumber &&
            displayName === "Original Prompt")),
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const handleHeaderClick = (e: React.MouseEvent) => {
    setShowPromptPlayground(true);
  };

  const handleRunClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRunColumn) {
      await onRunColumn(props.column.colId);
    }
  };

  const handleRunClickOnboarding = () => {
    if (onRunColumn) {
      onRunColumn(props.column.colId);
    }
  };

  //TODO: FIX!!!

  const hasDiff = useMemo(() => {
    return (
      (promptTemplate?.helicone_template as any)?.messages &&
      (originalPromptTemplate?.helicone_template as any)?.messages
    );
  }, [promptTemplate, originalPromptTemplate]);

  return (
    <Popover
      open={
        showPromptPlayground ||
        (isOnboardingVisible &&
          currentStep === ONBOARDING_STEPS.EXPERIMENTS_ORIGINAL.stepNumber &&
          displayName === "Original Prompt")
      }
      onOpenChange={setShowPromptPlayground}
    >
      <PopoverTrigger asChild>
        <div
          className="flex items-center justify-between w-full h-full pl-2 cursor-pointer"
          onClick={handleHeaderClick}
        >
          <Popover
            open={
              isOnboardingVisible &&
              currentStep ===
                ONBOARDING_STEPS.EXPERIMENTS_FIND_EXPERIMENT.stepNumber &&
              displayName === "Prompt 1"
            }
          >
            <PopoverTrigger>
              <div
                className="flex items-center space-x-2"
                data-onboarding-step={
                  displayName === "Prompt 1" &&
                  ONBOARDING_STEPS.EXPERIMENTS_FIND_EXPERIMENT.stepNumber
                }
              >
                <span className="text-md font-semibold text-slate-900">
                  {displayName}
                </span>
                <Badge
                  variant={badgeVariant}
                  className="text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0] rounded-md font-medium hover:bg-slate-100"
                >
                  {badgeText}
                </Badge>
              </div>
            </PopoverTrigger>
            <OnboardingPopoverContent
              onboardingStep="EXPERIMENTS_FIND_EXPERIMENT"
              align="center"
              side="bottom"
            />
          </Popover>
          {onRunColumn && (
            <Popover
              open={
                isOnboardingVisible &&
                currentStep ===
                  ONBOARDING_STEPS.EXPERIMENTS_RUN_EXPERIMENTS.stepNumber
              }
            >
              <PopoverTrigger>
                <div>
                  <Button
                    variant="ghost"
                    className="ml-2 p-0 border-slate-200 border rounded-md bg-slate-50 text-slate-500 h-[22px] w-[24px] flex items-center justify-center"
                    onClick={handleRunClick}
                    data-onboarding-step={
                      displayName === "Prompt 1" &&
                      ONBOARDING_STEPS.EXPERIMENTS_RUN_EXPERIMENTS.stepNumber
                    }
                  >
                    <PlayIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </Button>
                </div>
              </PopoverTrigger>
              <OnboardingPopoverContent
                next={handleRunClickOnboarding}
                onboardingStep="EXPERIMENTS_RUN_EXPERIMENTS"
                align="start"
                side="right"
              />
            </Popover>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[800px] p-0"
        side="bottom"
        align={isOnboardingVisible ? "start" : undefined}
      >
        {hasDiff ? (
          <Tabs defaultValue="preview" className="w-full">
            <TabsList
              className="w-full flex justify-end rounded-none"
              variant={"secondary"}
            >
              <TabsTrigger value="diff">Diff</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="diff">
              <ArrayDiffViewer
                origin={
                  originalPromptTemplate?.helicone_template?.messages ?? []
                }
                target={
                  (promptTemplate?.helicone_template as any)?.messages ?? []
                }
              />
            </TabsContent>
            <TabsContent value="preview">
              <PromptPlayground
                prompt={
                  promptTemplate?.helicone_template ??
                  (props.hypothesis?.promptVersion?.template || "")
                }
                selectedInput={undefined}
                onSubmit={(history, model) => {
                  setShowPromptPlayground(false);
                }}
                submitText="Save"
                initialModel={
                  promptTemplate?.model ||
                  props.hypothesis?.promptVersion?.model ||
                  ""
                }
                isPromptCreatedFromUi={false}
                defaultEditMode={false}
                editMode={false}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <Popover
            open={
              !isPromptTemplateLoading &&
              isOnboardingVisible &&
              currentStep ===
                ONBOARDING_STEPS.EXPERIMENTS_ORIGINAL.stepNumber &&
              displayName === "Original Prompt"
            }
          >
            <PopoverTrigger asChild>
              <div
                data-onboarding-step={
                  !isPromptTemplateLoading &&
                  isOnboardingVisible &&
                  currentStep ===
                    ONBOARDING_STEPS.EXPERIMENTS_ORIGINAL.stepNumber &&
                  displayName === "Original Prompt"
                    ? ONBOARDING_STEPS.EXPERIMENTS_ORIGINAL.stepNumber
                    : undefined
                }
              >
                <PromptPlayground
                  prompt={
                    promptTemplate?.helicone_template ??
                    (props.hypothesis?.promptVersion?.template || "")
                  }
                  selectedInput={undefined}
                  onSubmit={(history, model) => {
                    setShowPromptPlayground(false);
                  }}
                  submitText="Save"
                  initialModel={
                    promptTemplate?.model ||
                    props.hypothesis?.promptVersion?.model ||
                    ""
                  }
                  isPromptCreatedFromUi={false}
                  defaultEditMode={false}
                  editMode={false}
                />
              </div>
            </PopoverTrigger>
            <OnboardingPopoverContent
              onboardingStep="EXPERIMENTS_ORIGINAL"
              align="start"
              side="bottom"
            />
          </Popover>
        )}
      </PopoverContent>
    </Popover>
  );
};

const InputsHeaderComponent: React.FC<any> = (props) => {
  const { displayName, badgeText, badgeVariant, onRunColumn, onHeaderClick } =
    props;

  return (
    <div className="flex items-center justify-between w-full h-full pl-2 cursor-pointer">
      <div className="flex items-center space-x-2">
        <span className="text-md font-semibold text-slate-900">
          {displayName}
        </span>
      </div>
    </div>
  );
};

const RowNumberHeaderComponent: React.FC<any> = (props) => {
  return (
    <div className="flex-1 text-center items-center space-x-2 justify-center ml-1">
      <ListBulletIcon className="h-5 w-5 text-slate-400" />
    </div>
  );
};

const PromptCellRenderer: React.FC<any> = (props) => {
  return (
    <div className="w-full h-full text-center items-center">{props.value}</div>
  );
};

const RowNumberCellRenderer: React.FC<any> = (props) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const dataRowIndex = props.data.rowIndex;
  const gridRowIndex =
    props.node.rowIndex !== undefined ? props.node.rowIndex + 1 : "N/A";

  const handleRunClick = () => {
    props.context.handleRunRow(dataRowIndex);
    setPopoverOpen(false); // Close popover after action
  };

  const handleDeleteClick = () => {
    props.context.handleDeleteRow(dataRowIndex);
    setPopoverOpen(false); // Close popover after action
  };

  return (
    <div className="w-full h-full">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild className="w-full h-full">
          <Button
            variant="ghost"
            className="flex items-center justify-center w-full h-full cursor-pointer"
            onClick={() => setPopoverOpen(!popoverOpen)}
          >
            {gridRowIndex}
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="p-2 w-32">
          <div className="flex flex-col items-center justify-start px-0">
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-start"
              onClick={handleRunClick}
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              Run
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full flex items-center justify-start"
              onClick={handleDeleteClick}
            >
              <TrashIcon className="w-4 h-4 mr-2 text-red-500" />
              Delete
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
export {
  InputCellRenderer,
  CustomHeaderComponent,
  RowNumberHeaderComponent,
  PromptCellRenderer,
  RowNumberCellRenderer,
  InputsHeaderComponent,
};
