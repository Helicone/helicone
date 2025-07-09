import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "../../components/layout/org/organizationContext";
import { getJawnClient } from "../../lib/clients/jawn";
import type { OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";

// TODO: Delete old prompts.tsx hooks and fix the paths here
export const useCreatePrompt = () => {
  const org = useOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      tags: string[];
      promptBody: OpenAIChatRequest;
    }) => {
      const jawnClient = getJawnClient(org?.currentOrg?.id);
      
      const result = await jawnClient.POST("/v1/prompt-2025", {
        body: {
          name: params.name,
          tags: params.tags,
          promptBody: params.promptBody,
        },
      });

      if (result.error || result.data?.error) {
        throw new Error(result.error || result.data?.error || "Failed to create prompt");
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
};