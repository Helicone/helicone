import { FreeTierLimitBanner } from "@/components/shared/FreeTierLimitBanner";
import { FreeTierLimitWrapper } from "@/components/shared/FreeTierLimitWrapper";
import { EmptyStateCard } from "@/components/shared/helicone/EmptyStateCard";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFeatureLimit } from "@/hooks/useFreeTierLimit";
import { cn } from "@/lib/utils";
import { LLMRequestBody } from "@helicone-package/llm-mapper/types";
import {
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  Square2StackIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useState } from "react";
import { PiPlusBold, PiSpinnerGapBold } from "react-icons/pi";
import {
  useCreatePrompt,
  usePrompts,
} from "../../../services/hooks/prompts/prompts";
import AuthHeader from "../../shared/authHeader";
import LoadingAnimation from "../../shared/loadingAnimation";
import { SimpleTable } from "../../shared/table/simpleTable";
import ThemedTabs from "../../shared/themed/themedTabs";
import useSearchParams from "../../shared/utils/useSearchParams";
import { Button } from "../../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { DiffHighlight } from "../welcome/diffHighlight";
import PromptCard from "./promptCard";
import PromptDelete from "./promptDelete";
import PromptUsageChart from "./promptUsageChart";

interface PromptsPageProps {
  defaultIndex: number;
}

const PromptsPage = (props: PromptsPageProps) => {
  const { prompts, isLoading, refetch } = usePrompts();
  const [searchName, setSearchName] = useState<string>("");
  const router = useRouter();
  const { createPrompt, isCreating } = useCreatePrompt();
  const searchParams = useSearchParams();
  const promptCount = prompts?.length ?? 0;
  const { canCreate, freeLimit } = useFeatureLimit("prompts", promptCount);
  const filteredPrompts = prompts?.filter((prompt) =>
    prompt.user_defined_id.toLowerCase().includes(searchName.toLowerCase())
  );

  const handleCreatePrompt = async () => {
    try {
      const basePrompt: LLMRequestBody = {
        model: "gpt-4o-mini",
        messages: [
          {
            _type: "message",
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            _type: "message",
            role: "user",
            content: 'What is 2+<helicone-prompt-input key="number" />?',
          },
        ],
      };
      const metadata = {
        provider: "OPENAI",
        createdFromUi: true,
      };

      const newPrompt = await createPrompt(basePrompt, metadata);
      if (newPrompt?.id) {
        router.push(`/prompts/${newPrompt.id}`);
      }
    } catch (error) {
      console.error("Error creating prompt:", error);
    }
  };

  if (!isLoading && promptCount === 0) {
    return (
      <div className="flex flex-col w-full h-screen bg-background dark:bg-sidebar-background">
        <div className="flex flex-1 h-full">
          <EmptyStateCard
            feature="prompts"
            onPrimaryClick={handleCreatePrompt}
          />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col gap-4">
      <AuthHeader
        className="min-w-full"
        title="Prompts"
        actions={
          <>
            <FreeTierLimitWrapper feature="prompts" itemCount={promptCount}>
              <Button
                variant="action"
                onClick={handleCreatePrompt}
                disabled={isCreating}
              >
                {isCreating ? (
                  <PiSpinnerGapBold className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <PiPlusBold className="h-4 w-4 mr-2" />
                )}
                {isCreating ? "Creating..." : "New Prompt"}
              </Button>
            </FreeTierLimitWrapper>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="text-slate-700" variant="link" size="sm">
                  Import from Code
                </Button>
              </DialogTrigger>
              <DialogContent className="h-[40rem] w-full max-w-4xl flex flex-col">
                <DialogHeader>
                  <DialogTitle>Import from Code</DialogTitle>
                </DialogHeader>

                {/* TODO: Allow for Python tab as well */}
                <DiffHighlight
                  className="h-full"
                  maxHeight={false}
                  code={`
// 1. Add this line
import { hpf } from "@helicone/prompts";

const chatCompletion = await openai.chat.completions.create(
  {
    messages: [
      {
        role: "user",
        // 2: Add hpf to any string, and nest any variable in \`\${{ }}\` with additional brackets
        content: hpf\`Write a story about \${{ scene }}\`,
      },
    ],
    model: "gpt-4o-mini",
  },
  {
    // 3. Add Prompt Id Header
    headers: {
      "Helicone-Prompt-Id": "prompt_story",
    },
  }
);`}
                  language="tsx"
                  newLines={[]}
                  oldLines={[]}
                  minHeight={false}
                />
              </DialogContent>
            </Dialog>
          </>
        }
      />
      {!canCreate && (
        <FreeTierLimitBanner
          feature="prompts"
          itemCount={promptCount}
          freeLimit={freeLimit}
          className="w-full"
        />
      )}
      {isLoading ? (
        // Loading State
        <div className="flex flex-col w-full mt-16 justify-center items-center">
          <LoadingAnimation title="Loading Prompts..." />
        </div>
      ) : (
        <>

          {/* Search & Card/Table View Toggle */}
          {promptCount > 0 && (
            <div
              id="util"
              className="flex flex-row justify-between items-center px-8 shrink-0"
            >
              <div className="flex flex-row items-center space-x-2 w-full">
                <div className="max-w-xs w-full">
                  <Input
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Search prompts..."
                    className="h-full"
                  />
                </div>
              </div>
              <ThemedTabs
                options={[
                  {
                    label: "table",
                    icon: TableCellsIcon,
                  },
                  {
                    label: "card",
                    icon: Square2StackIcon,
                  },
                ]}
                onOptionSelect={function (option: string): void {
                  if (option === "table") {
                    searchParams.set("view", "table");
                  } else {
                    searchParams.set("view", "card");
                  }
                }}
                initialIndex={searchParams.get("view") === "card" ? 1 : 0}
              />
            </div>
          )}

          {/* Content Based on State */}
          {filteredPrompts && filteredPrompts.length > 0 ? (
            searchParams.get("view") === "card" ? (
              // Card View
              <ul
                className={cn(
                  "w-full h-full grid grid-cols-2 xl:grid-cols-4 gap-4 px-8"
                )}
              >
                {filteredPrompts.map((prompt, i) => (
                  <li key={i} className="col-span-1">
                    <PromptCard prompt={prompt} />
                  </li>
                ))}
              </ul>
            ) : (
              // Table View
              <SimpleTable
                data={filteredPrompts ?? []}
                columns={[
                  {
                    key: "user_defined_id",
                    header: "Name",
                    render: (prompt) => (
                      <div className="text-black dark:text-white font-semibold underline flex items-center">
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        {prompt.user_defined_id}
                      </div>
                    ),
                  },
                  {
                    key: "created_at",
                    header: "Created At",
                    render: (prompt) => (
                      <div className="text-gray-500">
                        {new Date(prompt.created_at).toLocaleString()}
                      </div>
                    ),
                  },
                  {
                    key: "major_version",
                    header: "Major Versions",
                    render: (prompt) => (
                      <div className="text-gray-500">
                        {prompt.major_version}
                      </div>
                    ),
                  },
                  {
                    key: undefined,
                    header: "Last 30 days",
                    render: (prompt) => (
                      <PromptUsageChart promptId={prompt.user_defined_id} />
                    ),
                  },
                  {
                    key: undefined,
                    header: "Permission",
                    render: (prompt) => (
                      <div>
                        {prompt.metadata?.createdFromUi === true ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium rounded-lg px-2 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white">
                                <PencilIcon className="h-4 w-4 mr-1" />
                                <p>Editable</p>
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent align="center">
                              <p>
                                This prompt was created{" "}
                                <span className="font-semibold">in the UI</span>
                                . You can edit / delete them, or promote to
                                prod.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium rounded-lg px-2 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white">
                                <EyeIcon className="h-4 w-4 mr-1" />
                                <p>View only</p>
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent align="center">
                              <p>
                                This prompt was created{" "}
                                <span className="font-semibold">in code</span>.
                                You won&apos;t be able to edit this from the UI.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: undefined,
                    header: "",
                    render: (prompt) => (
                      <PromptDelete
                        promptId={prompt.id}
                        promptName={prompt.user_defined_id}
                        onSuccess={() => {
                          refetch();
                        }}
                      />
                    ),
                  },
                ]}
                onSelect={(prompt) => {
                  router.push(`/prompts/${prompt.id}`);
                }}
              />
            )
          ) : (
            // Fallback for when filtering returns no results
            <div className="flex items-center justify-center mt-[10rem]">
              <div className="flex flex-col items-center justify-center gap-6 px-4 text-center max-w-lg">
                <p className="text-gray-500 text-lg">
                  No prompts match your search criteria.
                </p>
                <Button variant="outline" onClick={() => setSearchName("")}>
                  Clear Search
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default PromptsPage;
