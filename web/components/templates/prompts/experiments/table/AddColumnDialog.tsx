import { useOrg } from "@/components/layout/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FlaskConicalIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PromptPlayground from "../../id/promptPlayground";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { OnboardingPopover } from "@/components/templates/onboarding/OnboardingPopover";
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
  // const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);
  const [promptVariables, setPromptVariables] = useState<
    {
      original: string;
      heliconeTag: string;
      value: string;
    }[]
  >([]);
  // const [scoreCriterias, setScoreCriterias] = useState<
  //   {
  //     scoreType?: (typeof SCORES)[number];
  //     criteria?: string;
  //   }[]
  // >([]);

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

      // const parentPromptVersion = await jawnClient.GET(
      //   "/v1/prompt/version/{promptVersionId}",
      //   {
      //     params: {
      //       path: {
      //         promptVersionId: res.data?.data?.parent_prompt_version ?? "",
      //       },
      //     },
      //   }
      // );

      // return {
      //   ...res.data?.data,
      //   parent_prompt_version: parentPromptVersion?.data?.data,
      // };
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
      <DialogContent className="w-[95vw] max-w-2xl gap-0">
        <OnboardingPopover
          popoverContentProps={{
            onboardingStep: "EXPERIMENTS_ADD_CHANGE_PROMPT",
            align: "start",
            alignOffset: 10,
          }}
          modal={true}
        >
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
        </OnboardingPopover>

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

// <Popover
//   open={isOpen}
//   onOpenChange={(open) => {
//     handleOpenChange(open);
//     setSelectedForkFromPromptVersionId(null);
//   }}
// >
//   <PopoverTrigger asChild>
//     <button className="p-1 text-gray-500 hover:text-gray-700 flex flex-row items-center space-x-2">
//       <PlusIcon className="w-5 h-5 text-slate-700 dark:text-slate-100" />
//       <span className="text-sm font-medium text-slate-700 dark:text-slate-100">
//         Add Prompt
//       </span>
//     </button>
//   </PopoverTrigger>
//   {isOpen &&
//     (selectedForkFromPromptVersionId && promptVersionTemplateData ? (
//       <PopoverContent className="w-[700px] p-4 bg-white" align="end">
//         <ScrollArea className="flex flex-col overflow-y-auto max-h-[700px]">
//           <div className="space-y-4">
//             <h3 className="font-semibold">Add New Experiment</h3>
//             {showSuggestionPanel && (
//               <Card className="bg-gray-50 border border-slate-200 py-2 px-4 rounded-md text-slate-900 mb-2">
//                 <CardHeader className="flex flex-row items-center justify-between p-0">
//                   <div className="flex gap-2 items-center text-slate-900 font-medium">
//                     <Wand2Icon className="w-4 h-4" />
//                     Give me a suggestion
//                   </div>
//                   <Button variant="ghost" size="icon">
//                     <XIcon
//                       className="w-4 h-4"
//                       onClick={() => setShowSuggestionPanel(false)}
//                     />
//                   </Button>
//                 </CardHeader>
//                 <CardContent className="flex flex-col gap-2">
//                   {scoreCriterias.map((criteria, index) => (
//                     <div className="flex gap-2 items-center" key={index}>
//                       <Select
//                         value={criteria.scoreType}
//                         onValueChange={(value) => {
//                           setScoreCriterias(
//                             scoreCriterias.map((c) =>
//                               c.scoreType === criteria.scoreType
//                                 ? { ...c, scoreType: value }
//                                 : c
//                             )
//                           );
//                         }}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Type" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {SCORES.filter(
//                             (score) =>
//                               !scoreCriterias.some(
//                                 (c) => c.scoreType === score
//                               ) || criteria.scoreType === score
//                           ).map((score) => (
//                             <SelectItem key={score} value={score}>
//                               {score}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                       <p className="text-xs font-semibold text-gray-400">
//                         IS
//                       </p>
//                       <Input
//                         placeholder="Type"
//                         className="w-24"
//                         value={criteria.criteria}
//                         onChange={(e) => {
//                           setScoreCriterias(
//                             scoreCriterias.map((c) =>
//                               c.scoreType === criteria.scoreType
//                                 ? { ...c, criteria: e.target.value }
//                                 : c
//                             )
//                           );
//                         }}
//                       />
//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="border border-slate-200 aspect-square"
//                       >
//                         <XIcon
//                           className="w-4 h-4"
//                           onClick={() => {
//                             setScoreCriterias(
//                               scoreCriterias.filter(
//                                 (c) => c.scoreType !== criteria.scoreType
//                               )
//                             );
//                           }}
//                         />
//                       </Button>
//                     </div>
//                   ))}
//                   <Button
//                     variant="ghost"
//                     className="mt-2 border border-slate-200 self-start"
//                     onClick={() => {
//                       setScoreCriterias([
//                         ...scoreCriterias,
//                         { scoreType: undefined, criteria: "" },
//                       ]);
//                     }}
//                   >
//                     <PlusIcon className="w-4 h-4" /> Add criteria
//                   </Button>
//                 </CardContent>
//                 {scoreCriterias.length > 0 &&
//                   scoreCriterias.every(
//                     (c) => c.scoreType && c.criteria
//                   ) && (
//                     <CardFooter>
//                       <Button className="flex items-center gap-2 w-full">
//                         <Wand2Icon className="w-4 h-4" />
//                         Suggest a prompt
//                       </Button>
//                     </CardFooter>
//                   )}
//               </Card>
//             )}
//             {!showSuggestionPanel && (
//               <Button
//                 variant="ghost"
//                 onClick={() => setShowSuggestionPanel(true)}
//                 className="flex items-center gap-2 bg-gray-50 text-slate-900 mb-4"
//               >
//                 <Wand2Icon className="w-4 h-4" />
//                 Give me a suggestion
//               </Button>
//             )}
//             <PromptPlayground
//               defaultEditMode={true}
//               prompt={promptVersionTemplateData?.helicone_template ?? ""}
//               selectedInput={undefined}
//               onExtractPromptVariables={(promptInputKeys) => {
//                 setPromptVariables(promptInputKeys);
//               }}
//               onSubmit={async (history, model) => {
//                 console.log({ history });
//                 const promptData = {
//                   model: model,
//                   messages: history.map((msg) => ({
//                     role: msg.role,
//                     content: [
//                       {
//                         text: msg.content,
//                         type: "text",
//                       },
//                     ],
//                   })),
//                 };

//                 const result = await jawn.POST(
//                   // "/v1/prompt/version/{promptVersionId}/subversion",
//                   "/v2/experiment/{experimentId}/prompt-version",
//                   {
//                     params: {
//                       path: {
//                         experimentId: experimentId,
//                       },
//                     },
//                     body: {
//                       newHeliconeTemplate: JSON.stringify(promptData),
//                       isMajorVersion: false,
//                       experimentId: experimentId,
//                       parentPromptVersionId:
//                         selectedForkFromPromptVersionId,
//                       bumpForMajorPromptVersionId:
//                         originalColumnPromptVersionId, // TODO: this will change based on other things later
//                       metadata: {
//                         label: `Prompt ${
//                           numberOfExistingPromptVersions + 1
//                         }`,
//                       },
//                     },
//                   }
//                 );

//                 queryClient.invalidateQueries({
//                   queryKey: [
//                     "experimentPromptVersions",
//                     orgId,
//                     experimentId,
//                   ],
//                 });
//                 queryClient.invalidateQueries({
//                   queryKey: ["experimentInputKeys", orgId, experimentId],
//                 });

//                 if (result.error || !result.data) {
//                   console.error(result);
//                   return;
//                 }

//                 setOpenAddExperimentModal(false);
//                 setIsOpen(false);
//               }}
//               submitText="Test"
//               initialModel={"gpt-4o"}
//               editMode={false}
//             />
//             <div className="flex justify-end pt-4">
//               <Button onClick={() => setOpenAddExperimentModal(false)}>
//                 Close
//               </Button>
//             </div>
//           </div>
//         </ScrollArea>
//       </PopoverContent>
//     ) : (
//       <PopoverContent className="w-[200px] p-4 bg-white" align="end">
//         <ScrollArea className="flex flex-col overflow-y-auto max-h-[700px]">
//           {experimentPromptVersions?.map((pv, i) => (
//             <div
//               key={pv.id}
//               onClick={() => setSelectedForkFromPromptVersionId(pv.id)}
//               className="w-full p-2 border-b border-slate-200 hover:bg-gray-50 cursor-pointer"
//             >
//               {pv.label ?? (i === 0 ? "Original" : `Prompt ${i}`)}
//             </div>
//           ))}
//         </ScrollArea>
//       </PopoverContent>
//     ))}
// </Popover>

export default AddColumnDialog;
