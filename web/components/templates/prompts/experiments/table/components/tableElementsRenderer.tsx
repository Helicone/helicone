import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useExperimentScores } from "@/services/hooks/prompts/experiment-scores";
import { PlayIcon, SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConicalIcon, GitForkIcon, LightbulbIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useJawnClient } from "../../../../../../lib/clients/jawnHook";
import { Button } from "../../../../../ui/button";
import ArrayDiffViewer from "../../../id/arrayDiffViewer";
import PromptPlayground, { PromptObject } from "../../../id/promptPlayground";
import { useExperimentTable } from "../hooks/useExperimentTable";
import { useOrg } from "@/components/layout/org/organizationContext";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export interface InputEntry {
  key: string;
  value: string;
}

interface ExperimentHeaderProps {
  experimentId: string;
  isOriginal: boolean;
  onRunColumn?: () => Promise<void>;
  originalPromptTemplate?: any;
  promptVersionId?: string;
  originalPromptVersionId?: string;
  onForkPromptVersion?: (promptVersionId: string) => void;
  showScores?: boolean;
  originalPrompt?: string;
}

const icon = (model: string) => {
  if (model.includes("gpt")) {
    return (
      <svg
        className="w-4 h-4"
        viewBox="0 0 12 13"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11.1415 5.41054C11.2756 5.00648 11.322 4.57843 11.2776 4.15501C11.2331 3.73158 11.0988 3.32251 10.8836 2.95514C10.5646 2.39985 10.0775 1.96022 9.4925 1.69962C8.90752 1.43902 8.25489 1.37092 7.62871 1.50514C7.27296 1.10942 6.81935 0.814273 6.31344 0.649344C5.80753 0.484414 5.26712 0.455508 4.7465 0.565527C4.22588 0.675546 3.74337 0.920619 3.34744 1.27613C2.95151 1.63164 2.65609 2.08507 2.49086 2.59089C2.07369 2.67643 1.67959 2.85003 1.33489 3.10008C0.990185 3.35014 0.702825 3.67088 0.49201 4.04089C0.169527 4.59525 0.0317005 5.2378 0.0984554 5.87566C0.16521 6.51351 0.433088 7.11361 0.86336 7.58919C0.728692 7.99305 0.681822 8.42102 0.725885 8.84446C0.769947 9.2679 0.903926 9.67705 1.11886 10.0445C1.43828 10.6 1.92582 11.0398 2.51121 11.3004C3.09661 11.561 3.74963 11.629 4.37616 11.4946C4.65879 11.8129 5.00607 12.0672 5.39481 12.2406C5.78356 12.4139 6.20481 12.5024 6.63046 12.5C7.27228 12.5006 7.89768 12.2972 8.4164 11.9192C8.93511 11.5413 9.3203 11.0082 9.51636 10.3971C9.93348 10.3114 10.3275 10.1377 10.6722 9.88768C11.0169 9.63764 11.3043 9.31695 11.5152 8.94704C11.8339 8.39349 11.9693 7.75335 11.9022 7.11816C11.8351 6.48298 11.5688 5.88524 11.1415 5.41054ZM6.63046 11.7146C6.10482 11.7154 5.59566 11.5312 5.19226 11.1942L5.26321 11.154L7.65236 9.77489C7.71182 9.74001 7.76119 9.69027 7.79562 9.63055C7.83004 9.57082 7.84834 9.50317 7.84871 9.43424V6.06579L8.85871 6.65009C8.8637 6.65262 8.86803 6.65629 8.87133 6.66081C8.87463 6.66533 8.87682 6.67056 8.87771 6.67609V9.46739C8.87644 10.063 8.63927 10.6339 8.2181 11.055C7.79693 11.4762 7.22607 11.7133 6.63046 11.7146ZM1.80011 9.65189C1.5365 9.1967 1.44185 8.66313 1.53281 8.14504L1.60381 8.18764L3.99531 9.56674C4.05448 9.60146 4.12185 9.61977 4.19046 9.61977C4.25907 9.61977 4.32644 9.60146 4.38561 9.56674L7.30701 7.88249V9.04869C7.30674 9.05473 7.3051 9.06064 7.30223 9.06596C7.29935 9.07128 7.29531 9.07589 7.29041 9.07944L4.87051 10.4751C4.35407 10.7726 3.74068 10.853 3.16501 10.6987C2.58935 10.5443 2.09845 10.1678 1.80011 9.65189ZM1.17091 4.44779C1.43635 3.98967 1.85533 3.64025 2.35366 3.46139V6.29999C2.35276 6.36857 2.37028 6.43613 2.4044 6.49562C2.43851 6.55512 2.48797 6.60437 2.54761 6.63824L5.45481 8.31539L4.44476 8.89964C4.43929 8.90254 4.4332 8.90406 4.42701 8.90406C4.42082 8.90406 4.41473 8.90254 4.40926 8.89964L1.99411 7.50639C1.47864 7.20759 1.10258 6.71671 0.948293 6.14123C0.794002 5.56574 0.874051 4.95257 1.17091 4.43599V4.44779ZM9.46906 6.37569L6.55241 4.68199L7.56011 4.09999C7.56558 4.09709 7.57167 4.09557 7.57786 4.09557C7.58405 4.09557 7.59014 4.09709 7.59561 4.09999L10.0108 5.49564C10.38 5.70871 10.6811 6.02244 10.8787 6.40019C11.0764 6.77794 11.1625 7.20413 11.1271 7.62899C11.0916 8.05385 10.936 8.45986 10.6784 8.79961C10.4209 9.13936 10.072 9.39883 9.67251 9.54774V6.70914C9.67042 6.64068 9.65056 6.57393 9.61488 6.51547C9.5792 6.457 9.52898 6.40886 9.46906 6.37569ZM10.4744 4.86414L10.4034 4.82154L8.01666 3.43064C7.95712 3.3957 7.88934 3.37728 7.82031 3.37728C7.75128 3.37728 7.6835 3.3957 7.62396 3.43064L4.70501 5.11484V3.94869C4.70439 3.94276 4.70538 3.93677 4.70788 3.93136C4.71038 3.92595 4.71429 3.92131 4.71921 3.91794L7.13436 2.52464C7.50452 2.3114 7.92774 2.20796 8.35452 2.22642C8.78131 2.24488 9.19402 2.38447 9.54438 2.62888C9.89474 2.87329 10.1683 3.2124 10.333 3.60655C10.4977 4.00071 10.5468 4.43361 10.4745 4.85464L10.4744 4.86414ZM4.15376 6.93149L3.14376 6.34959C3.13871 6.34654 3.13439 6.34243 3.1311 6.33753C3.12782 6.33263 3.12565 6.32707 3.12476 6.32124V3.53709C3.12532 3.10997 3.24745 2.69184 3.47689 2.33159C3.70632 1.97133 4.03357 1.68383 4.42038 1.50271C4.80719 1.32158 5.23757 1.25432 5.66119 1.30878C6.08482 1.36324 6.48419 1.53717 6.81261 1.81024L6.74161 1.85049L4.35251 3.22949C4.29305 3.26436 4.24368 3.3141 4.20925 3.37383C4.17483 3.43355 4.15653 3.5012 4.15616 3.57014L4.15376 6.93149ZM4.70256 5.74879L6.00356 4.99889L7.30701 5.74879V7.24849L6.00831 7.99834L4.70496 7.24849L4.70256 5.74879Z"
          fill="#64748B"
        />
      </svg>
    );
  }
  return <SparklesIcon className="w-4 h-4" />;
};

const ExperimentTableHeader = (props: ExperimentHeaderProps) => {
  const {
    promptVersionId,
    originalPromptTemplate,
    isOriginal,
    onForkPromptVersion,
    experimentId,
    originalPromptVersionId,
  } = props;

  const org = useOrg();
  const orgId = org?.currentOrg?.id;

  const [showViewPrompt, setShowViewPrompt] = useState(false);
  const jawnClient = useJawnClient();

  // Use React Query to fetch and cache the prompt template
  const { data: promptTemplate } = useQuery(
    ["promptTemplate", promptVersionId],
    async () => {
      if (!promptVersionId) return null;

      const res = await jawnClient.GET("/v1/prompt/version/{promptVersionId}", {
        params: {
          path: {
            promptVersionId: promptVersionId,
          },
        },
      });

      const parentPromptVersion = await jawnClient.GET(
        "/v1/prompt/version/{promptVersionId}",
        {
          params: {
            path: {
              promptVersionId: res.data?.data?.parent_prompt_version ?? "",
            },
          },
        }
      );

      return {
        ...res.data?.data,
        parent_prompt_version: parentPromptVersion?.data?.data,
      };
    },
    {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  const queryClient = useQueryClient();

  const promptVersionIdScore = useQuery<{
    data: Record<string, { value: any; max: number; min: number }>;
  }>({
    queryKey: ["experimentScores", experimentId, promptVersionId],
    queryFn: () => {
      const scores = queryClient.getQueryData<Record<string, any>>([
        "experimentScores",
        experimentId,
      ]);
      return scores?.[promptVersionId ?? ""] ?? { data: {} };
    },
  });

  const { selectedScoreKey } = useExperimentTable(experimentId);
  const { getScoreColorMapping } = useExperimentScores(experimentId);
  const scoreColorMapping = useMemo(() => {
    const scores = Object.keys(promptVersionIdScore.data?.data ?? {});
    return getScoreColorMapping(scores);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptVersionIdScore.data?.data]);

  const [basePrompt, setBasePrompt] = useState<string | PromptObject | null>(
    promptTemplate?.helicone_template ?? ""
  );

  useEffect(() => {
    setBasePrompt(promptTemplate?.helicone_template ?? "");
  }, [promptTemplate]);

  return (
    <Dialog open={showViewPrompt} onOpenChange={setShowViewPrompt}>
      <DialogTrigger asChild>
        <div
          className="flex flex-col gap-2 h-full overflow-y-auto p-3 cursor-pointer"
          onClick={() => setShowViewPrompt(true)}
        >
          <div
            className={cn(
              "flex flex-col",
              Object.keys(promptVersionIdScore.data?.data ?? {}).length
                ? "gap-4"
                : "gap-0"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {promptVersionIdScore.data && (
              <div className="flex gap-2 flex-wrap">
                {selectedScoreKey ? (
                  <div
                    className="w-full flex flex-col gap-1 py-1.5 px-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-tight">
                        {(selectedScoreKey ?? "")
                          .toString()
                          .replace("-hcone-bool", "") ?? ""}
                      </p>
                      <XMarkIcon
                        className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          queryClient.setQueryData(
                            ["selectedScoreKey", experimentId],
                            null
                          );
                        }}
                      />
                    </div>
                    <div className="flex gap-3 items-center text-slate-500 text-[11px] leading-tight">
                      <p>
                        avg:{" "}
                        {
                          promptVersionIdScore.data?.data?.[selectedScoreKey]
                            ?.value
                        }
                      </p>
                      <p>
                        max:{" "}
                        {
                          promptVersionIdScore.data?.data?.[selectedScoreKey]
                            ?.max
                        }
                      </p>
                      <p>
                        min:{" "}
                        {
                          promptVersionIdScore.data?.data?.[selectedScoreKey]
                            ?.min
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  Object.entries(
                    (
                      promptVersionIdScore.data as {
                        data: Record<string, { value: any }>;
                      }
                    )?.data ?? {}
                  ).map(([key, value]) => {
                    const color = scoreColorMapping[key]?.color;
                    return (
                      <Badge
                        className="gap-1.5"
                        variant="helicone"
                        key={key}
                        onClick={(e) => {
                          e.stopPropagation();
                          queryClient.setQueryData(
                            ["selectedScoreKey", experimentId],
                            key
                          );
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-sm"
                          style={{ backgroundColor: color }}
                        ></div>
                        {key?.toString().replace("-hcone-bool", "") ?? ""}:{" "}
                        {value?.value}
                      </Badge>
                    );
                  })
                )}
              </div>
            )}
            <div className="flex gap-2 items-center ml-0.5">
              {icon(promptTemplate?.model ?? "")}
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {promptTemplate?.model}
              </span>
            </div>
          </div>
          <PromptPlayground
            prompt={promptTemplate?.helicone_template ?? ""}
            selectedInput={undefined}
            onSubmit={(history, model) => {
              setShowViewPrompt(false);
            }}
            submitText="Save"
            initialModel={promptTemplate?.model ?? ""}
            isPromptCreatedFromUi={false}
            defaultEditMode={false}
            editMode={false}
            playgroundMode="experiment-compact"
            className="border rounded-md border-slate-200 dark:border-slate-700"
          />
        </div>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-7xl max-h-[95vh] gap-0 overflow-y-auto items-start flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <FlaskConicalIcon className="w-5 h-5 mr-2.5 text-slate-500" />
            <DialogTitle asChild>
              <h3 className="text-base font-medium text-slate-950 dark:text-white mr-3">
                View Prompt
              </h3>
            </DialogTitle>
            <div className="flex gap-1 items-center">
              <p className="text-slate-500 text-sm font-medium leading-4">
                Forked from
              </p>
              <Badge variant="helicone" className="text-slate-500">
                <FlaskConicalIcon className="w-3.5 h-3.5 mr-1" />
                {(promptTemplate?.parent_prompt_version?.metadata
                  ?.label as string) ??
                  `v${promptTemplate?.parent_prompt_version?.major_version}.${promptTemplate?.parent_prompt_version?.minor_version}`}
              </Badge>
            </div>
          </div>
        </div>
        <Tabs defaultValue="preview" className="h-full w-full">
          {!isOriginal && (
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="diff">Diff</TabsTrigger>
            </TabsList>
          )}
          <TabsContent value="preview" className="max-h-[80vh] overflow-y-auto">
            <PromptPlayground
              defaultEditMode={true}
              prompt={basePrompt ?? ""}
              onPromptChange={(prompt) => setBasePrompt(prompt)}
              selectedInput={undefined}
              onExtractPromptVariables={() => {}}
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

                const result = await jawnClient.POST(
                  "/v1/prompt/version/{promptVersionId}/edit-template",
                  {
                    params: {
                      path: {
                        promptVersionId: promptVersionId ?? "",
                      },
                    },
                    body: {
                      heliconeTemplate: JSON.stringify(promptData),
                      experimentId: experimentId ?? "",
                    },
                  }
                );

                queryClient.invalidateQueries({
                  queryKey: ["experimentInputKeys", orgId, experimentId],
                });
                queryClient.invalidateQueries({
                  queryKey: ["promptTemplate", promptVersionId],
                });
                if (result.error || !result.data) {
                  console.error(result);
                  return;
                }

                setShowViewPrompt(false);
              }}
              submitText="Test"
              initialModel={promptTemplate?.model ?? "gpt-4o"}
              editMode={false}
            />
          </TabsContent>
          <TabsContent value="diff" className="max-h-[80vh] overflow-y-auto">
            <ArrayDiffViewer
              origin={originalPromptTemplate?.helicone_template?.messages ?? []}
              target={
                (promptTemplate?.helicone_template as any)?.messages ?? []
              }
            />
          </TabsContent>
        </Tabs>
        <div className="flex justify-between items-center mt-8">
          <div className="flex items-center gap-1">
            <LightbulbIcon className="w-4 h-4 text-slate-500" />
            <p className="text-sm text-slate-500">
              To make changes, please create a new prompt.
            </p>
          </div>

          <Button
            variant="ghost"
            className="text-slate-900 dark:text-slate-100"
            onClick={() => {
              if (onForkPromptVersion) {
                onForkPromptVersion(promptVersionId ?? "");
                setShowViewPrompt(false);
              }
            }}
          >
            Fork Prompt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const InputsHeaderComponent = ({ inputs }: { inputs: string[] }) => {
  return (
    <div className="flex flex-col h-full items-start justify-start gap-y-2 p-3">
      {inputs?.map((input) => (
        <Badge variant="helicone" key={input}>
          {input}
        </Badge>
      ))}
    </div>
  );
};

const PromptColumnHeader = ({
  label,
  onForkColumn,
  onRunColumn,
  promptVersionId,
}: {
  label: string;
  onForkColumn?: () => void;
  onRunColumn?: () => void;
  promptVersionId: string;
}) => {
  const [labelData, setLabelData] = useState(label);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLabel, setEditedLabel] = useState(labelData);
  const inputRef = useRef<HTMLInputElement>(null);

  const jawnClient = useJawnClient();
  const queryClient = useQueryClient();
  // Handle saving the label
  const handleSave = async () => {
    setIsEditing(false);
    setLabelData(editedLabel);
    if (editedLabel !== labelData) {
      const result = await jawnClient.POST(
        "/v1/prompt/version/{promptVersionId}/edit-label",
        {
          params: {
            path: {
              promptVersionId: promptVersionId ?? "",
            },
          },
          body: {
            label: editedLabel,
          },
        }
      );

      setLabelData(result.data?.data?.metadata?.label as string);
      if (result.error || !result.data) {
        console.error(result);
        return;
      }
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  return (
    <div
      className={cn(
        "flex justify-between w-full items-center py-2 px-4 group h-full",
        isEditing &&
          " border-2 border-r-[3px] border-blue-500 z-10 pl-3.5 pr-[13px]"
      )}
    >
      {promptVersionId === "inputs" ? (
        <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-[130%] cursor-pointer">
          {labelData}
        </h3>
      ) : isEditing ? (
        <Input
          ref={inputRef}
          type="text"
          value={editedLabel}
          onChange={(e) => setEditedLabel(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSave();
            }
          }}
          className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-[130%] bg-transparent border-none focus:ring-slate-300 rounded px-[5px] py-0 w-auto h-auto border-0 outline-none focus:border-0 focus:ring-0 focus:shadow-none focus:outline-none"
        />
      ) : (
        <h3
          onClick={() => setIsEditing(true)}
          className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-[130%] cursor-pointer px-1 rounded transition-colors duration-150 border border-dashed border-transparent hover:border-slate-300 dark:hover:border-slate-600"
        >
          {labelData}
        </h3>
      )}
      {onForkColumn && onRunColumn && (
        <div className="items-center justify-center hidden group-hover:flex">
          <Button
            variant="ghost"
            size="icon"
            className="p-0 h-auto w-auto !hover:bg-transparent"
            onClick={onForkColumn}
          >
            <GitForkIcon className="w-4 h-4 text-slate-500" />
          </Button>
          <Button
            variant="outline"
            className="ml-2 p-0 border rounded-md text-slate-500 h-[22px] w-[24px] items-center justify-center flex"
            onClick={onRunColumn}
          >
            <PlayIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </Button>
        </div>
      )}
    </div>
  );
};

const IndexColumnCell = ({
  index,
  onRunRow,
  isSelected,
  onSelectChange,
  areSomeSelected,
}: {
  index: number;
  onRunRow: () => void;
  isSelected: boolean;
  areSomeSelected: boolean;
  onSelectChange: (e: unknown) => void;
}) => {
  return (
    <div className="absolute inset-0 flex justify-center items-start gap-1 py-2">
      <div className="flex items-center gap-1">
        <div className="relative flex justify-center items-center">
          <p
            className={cn(
              "text-slate-500 dark:text-slate-400 absolute inset-0 flex items-center",
              (areSomeSelected || isSelected) && "hidden",
              "group-hover:hidden"
            )}
          >
            {index}
          </p>
          <Checkbox
            className={cn(
              "border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 data-[state=checked]:border-0 dark:data-[state=checked]:border-0 data-[state=checked]:bg-slate-800 dark:data-[state=checked]:bg-slate-300 h-4 w-4 rounded-sm self-center",
              !areSomeSelected && !isSelected && "invisible group-hover:visible"
            )}
            checked={isSelected}
            onCheckedChange={onSelectChange}
          />
        </div>
        <Button
          variant="outline"
          className={cn(
            "p-0 border rounded-md h-[22px] w-[24px] flex items-center justify-center shrink-0",
            !areSomeSelected && !isSelected && "invisible group-hover:visible"
          )}
          onClick={onRunRow}
        >
          <PlayIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </Button>
      </div>
    </div>
  );
};

const InputCell = ({
  experimentInputs,
  experimentAutoInputs,
  rowInputs,
  onClick,
  rowRecordId,
  onRunRow,
  onSelectChange,
}: {
  experimentInputs: string[];
  experimentAutoInputs: any[];
  rowInputs: Record<string, string>;
  onClick: () => void;
  rowRecordId: string;
  onRunRow: () => void;
  onSelectChange: (e: unknown) => void;
}) => {
  const inputs = useQuery({
    queryKey: ["inputs", rowRecordId],
    queryFn: () => rowInputs,
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 h-full w-full py-2 px-4 overflow-hidden"
          style={{ cursor: "pointer", minWidth: 0 }} // Add minWidth: 0 to allow shrinking
          onClick={onClick}
        >
          <ul className="w-full flex flex-col gap-y-1 overflow-hidden">
            {experimentInputs?.map((input) => (
              <li
                key={input}
                className="text-slate-700 dark:text-slate-300 leading-[130%] text-[13px] max-w-full overflow-hidden whitespace-nowrap truncate flex"
              >
                <span className="font-medium shrink-0">{input}</span>:&nbsp;
                <span className="truncate">
                  {inputs.data?.[input]?.toString()}
                </span>
              </li>
            ))}
            {experimentAutoInputs.length > 0 &&
              experimentAutoInputs?.map((input, index) => (
                <li
                  key={index}
                  className="text-slate-700 dark:text-slate-300 leading-[130%] text-[13px] max-w-full overflow-hidden whitespace-nowrap truncate flex"
                >
                  <span className="font-medium shrink-0">Message {index}</span>
                  :&nbsp;
                  <span className="truncate">{JSON.stringify(input)}</span>
                </li>
              ))}
          </ul>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onRunRow}>Run Row</ContextMenuItem>
        <ContextMenuItem onClick={onSelectChange}>Delete Row</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export {
  ExperimentTableHeader,
  IndexColumnCell,
  InputCell,
  InputsHeaderComponent,
  PromptColumnHeader,
};
