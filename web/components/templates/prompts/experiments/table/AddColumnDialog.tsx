import { useOrg } from "@/components/layout/org/organizationContext";
import UniversalPopup from "@/components/shared/universal/Popup";
import PromptEditor from "@/components/templates/prompts/id/PromptEditor";
import { Button } from "@/components/ui/button";
import { getJawnClient } from "@/lib/clients/jawn";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { LLMRequestBody } from "@/packages/llm-mapper/types";
import { PromptState } from "@/types/prompt-state";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

export default function AddColumnDialog({
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
}) {
  const org = useOrg();
  const orgId = org?.currentOrg?.id;
  const jawn = useJawnClient();
  const queryClient = useQueryClient();
  const [promptState, setPromptState] = useState<PromptState | null>(null);

  const {
    data: promptVersionTemplateData,
    status,
    isFetching,
  } = useQuery({
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

  const basePromptForEditor = useMemo(() => {
    return {
      body: promptVersionTemplateData?.helicone_template as LLMRequestBody,
      metadata: promptVersionTemplateData?.metadata as {
        provider: string;
        isProduction: boolean;
        inputs?: Record<string, string>;
      },
      onUpdateState: (state: PromptState | null) => {
        console.log("updating state", state);
        setPromptState(state);
      },
    };
  }, [promptVersionTemplateData]);

  // TODO: PromptVersion Metadata is being overwritten inside Experiments at some point.
  // This must be fixed so that existing values are only concatted to the metadata object.
  console.log(basePromptForEditor);

  const label =
    (promptVersionTemplateData?.metadata?.label as string) ??
    `v${promptVersionTemplateData?.major_version}.${promptVersionTemplateData?.minor_version}`;

  return (
    <UniversalPopup
      title={`Add Prompt (from ${label})`}
      isOpen={isOpen}
      width="max-w-5xl"
      onClose={() => onOpenChange(false)}
    >
      {basePromptForEditor && <PromptEditor basePrompt={basePromptForEditor} />}

      <div className="flex flex-row gap-2 w-full p-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          variant="action"
          className="w-full"
          disabled={!promptState}
          onClick={async () => {
            if (!promptState) {
              return;
            }

            const newHeliconeTemplate: LLMRequestBody = {
              model: promptState.parameters.model,
              messages: promptState.messages,
              tools: promptState.parameters.tools,
              temperature: promptState.parameters.temperature,
              max_tokens: promptState.parameters.max_tokens,
              stop: promptState.parameters.stop,
            };

            const result = await jawn.POST(
              "/v2/experiment/{experimentId}/prompt-version",
              {
                params: {
                  path: {
                    experimentId: experimentId,
                  },
                },
                body: {
                  newHeliconeTemplate: newHeliconeTemplate,
                  isMajorVersion: false,
                  experimentId: experimentId,
                  parentPromptVersionId: selectedForkFromPromptVersionId ?? "",
                  bumpForMajorPromptVersionId: originalColumnPromptVersionId,
                  metadata: {
                    label: `Prompt ${numberOfExistingPromptVersions + 1}`,
                  },
                },
              }
            );

            // Explicitly type the result to help the linter
            const typedResult = result as unknown as {
              data: any;
              error: string | null;
            };

            if (typedResult.error || !typedResult.data) {
              console.error("Failed to add prompt version", typedResult.error);
              // TODO: Add user-facing error handling
              return;
            }

            queryClient.invalidateQueries({
              queryKey: ["experimentPromptVersions", orgId, experimentId],
            });
            queryClient.invalidateQueries({
              queryKey: ["experimentInputKeys", orgId, experimentId],
            });
            queryClient.invalidateQueries({
              queryKey: ["experimentTable", experimentId],
            });

            onOpenChange(false);
          }}
        >
          Add Prompt to Column
        </Button>
      </div>
    </UniversalPopup>
  );
}
