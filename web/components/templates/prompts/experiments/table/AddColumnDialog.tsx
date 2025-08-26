import { useOrg } from "@/components/layout/org/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FlaskConicalIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PromptPlayground, { PromptObject } from "../../id/promptPlayground";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { logger } from "@/lib/telemetry/logger";

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
  const jawn = useJawnClient();
  const queryClient = useQueryClient();

  const org = useOrg();
  const orgId = org?.currentOrg?.id;

  const { data: promptVersionTemplateData } = useQuery({
    queryKey: ["promptVersionTemplate", selectedForkFromPromptVersionId],
    queryFn: async () => {
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
    enabled: !!selectedForkFromPromptVersionId && !!orgId,
  });

  const [basePrompt, setBasePrompt] = useState<string | PromptObject | null>(
    promptVersionTemplateData?.helicone_template ?? "",
  );

  useEffect(() => {
    setBasePrompt(promptVersionTemplateData?.helicone_template ?? "");
  }, [promptVersionTemplateData]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-5xl gap-0 overflow-y-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <FlaskConicalIcon className="mr-2.5 h-5 w-5 text-slate-500" />
            <h3 className="mr-3 text-base font-medium text-slate-950 dark:text-white">
              Add Prompt
            </h3>
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium leading-4 text-slate-500">
                Forked from
              </p>
              <Badge variant="helicone" className="text-slate-500">
                <FlaskConicalIcon className="mr-1 h-3.5 w-3.5" />
                {(promptVersionTemplateData?.metadata?.label as string) ??
                  `v${promptVersionTemplateData?.major_version}.${promptVersionTemplateData?.minor_version}`}
              </Badge>
            </div>
          </div>
        </div>

        {promptVersionTemplateData && basePrompt && (
          <PromptPlayground
            defaultEditMode={true}
            prompt={basePrompt}
            selectedInput={undefined}
            onExtractPromptVariables={() => {}}
            className="rounded-md border border-slate-200 dark:border-slate-700"
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
                },
              );

              queryClient.invalidateQueries({
                queryKey: ["experimentPromptVersions", orgId, experimentId],
              });
              queryClient.invalidateQueries({
                queryKey: ["experimentInputKeys", orgId, experimentId],
              });

              if (result.error || !result.data) {
                logger.error({ result }, "Error occurred");
                return;
              }

              onOpenChange(false);
            }}
            onPromptChange={(prompt) => {
              setBasePrompt(prompt);
            }}
            submitText="Create Prompt"
            initialModel={promptVersionTemplateData?.model ?? "gpt-4o"}
            editMode={false}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddColumnDialog;
