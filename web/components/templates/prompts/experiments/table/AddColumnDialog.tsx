import { useOrg } from "@/components/layout/org/organizationContext";
import UniversalPopup from "@/components/shared/universal/Popup";
import PromptEditor from "@/components/templates/prompts/id/PromptEditor";
import { Button } from "@/components/ui/button";
import { getJawnClient } from "@/lib/clients/jawn";
import { LLMRequestBody } from "@/packages/llm-mapper/types";
import { useQuery } from "@tanstack/react-query";

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

  console.log(
    "Query Data:",
    promptVersionTemplateData,
    "| selectedForkFromPromptVersionId:",
    selectedForkFromPromptVersionId,
    "| orgId:",
    orgId,
    "| status:",
    status,
    "| isFetching:",
    isFetching
  );

  const basePromptForEditor = {
    body: promptVersionTemplateData?.helicone_template as LLMRequestBody,
    metadata: promptVersionTemplateData?.metadata as {
      provider: string;
      isProduction: boolean;
      inputs?: Record<string, string>;
    },
    onFork: () => {
      console.log("forking");
    },
  };
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
      <PromptEditor basePrompt={basePromptForEditor} />
      <div className="flex flex-row gap-2 w-full p-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button variant="action" className="w-full">
          Add Prompt to Column
        </Button>
      </div>
    </UniversalPopup>
  );
}
