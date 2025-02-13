import { ProFeatureWrapper } from "@/components/shared/ProBlockerComponents/ProFeatureWrapper";
import { InfoBox } from "@/components/ui/helicone/infoBox";
import {
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  Square2StackIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { PiPlusBold, PiSpinnerGapBold } from "react-icons/pi";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import { usePrompts } from "../../../services/hooks/prompts/prompts";
import AuthHeader from "../../shared/authHeader";
import LoadingAnimation from "../../shared/loadingAnimation";
import useNotification from "../../shared/notification/useNotification";
import { SimpleTable } from "../../shared/table/simpleTable";
import ThemedTabs from "../../shared/themed/themedTabs";
import useSearchParams from "../../shared/utils/useSearchParams";
import { Button } from "../../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { DiffHighlight } from "../welcome/diffHighlight";
import PromptCard from "./promptCard";
import PromptDelete from "./promptDelete";
import PromptUsageChart from "./promptUsageChart";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PromptsPreview from "../featurePreview/promptsPreview";
import { useHasAccess } from "@/hooks/useHasAccess";
import { SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";

interface PromptsPageProps {
  defaultIndex: number;
}

const PromptsPage = (props: PromptsPageProps) => {
  const { prompts, isLoading, refetch } = usePrompts();
  const [searchName, setSearchName] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // New loading state for the create prompt button
  const [isCreatingPrompt, setIsCreatingPrompt] = useState<boolean>(false);

  const notification = useNotification();
  const filteredPrompts = prompts?.filter((prompt) =>
    prompt.user_defined_id.toLowerCase().includes(searchName.toLowerCase())
  );
  const jawn = useJawnClient();

  const createPrompt = async (userDefinedId: string) => {
    // Prepare base prompt data
    const basePrompt = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: "What is 2+2?",
        },
      ],
    };

    const res = await jawn.POST("/v1/prompt/create", {
      body: {
        userDefinedId,
        prompt: basePrompt,
        metadata: {
          createdFromUi: true,
        },
      },
    });

    if (res.error || !res.data.data?.id) {
      notification.setNotification("Error creating prompt", "error");
    } else {
      notification.setNotification("Prompt created successfully", "success");
      router.push(`/prompts/${res.data.data?.id}`);
    }
  };

  // New handler for creating a prompt with placeholder values
  const handleCreatePrompt = async () => {
    setIsCreatingPrompt(true);
    try {
      // Generate a unique name like "new prompt", "new prompt (1)", etc.
      const basePromptName = "new-prompt";
      const existingPrompts = prompts || [];

      let promptName = basePromptName;
      let counter = 1;

      while (existingPrompts.some((p) => p.user_defined_id === promptName)) {
        promptName = `${basePromptName}-${counter}`;
        counter++;
      }

      await createPrompt(promptName);
    } finally {
      setIsCreatingPrompt(false);
    }
  };

  const hasAccess = useHasAccess("prompts");
  const hasLimitedAccess = useMemo(() => {
    return !hasAccess && (prompts?.length ?? 0) > 0;
  }, [hasAccess, prompts?.length]);

  return (
    <main>
      <AuthHeader
        className="min-w-full"
        title={
          hasAccess || hasLimitedAccess ? (
            <div className="flex items-center gap-2">
              Prompts
              {hasLimitedAccess && (
                <InfoBox className="ml-4">
                  <p className="text-sm font-medium flex gap-2">
                    <b>Need to create new prompts?</b>
                    <ProFeatureWrapper featureName="Prompts">
                      <button className="underline">
                        Get unlimited prompts & more.
                      </button>
                    </ProFeatureWrapper>
                  </p>
                </InfoBox>
              )}
            </div>
          ) : null
        }
        actions={
          hasAccess ? (
            <>
              <Button
                variant="action"
                onClick={handleCreatePrompt}
                disabled={isCreatingPrompt}
              >
                {isCreatingPrompt ? (
                  <PiSpinnerGapBold className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <PiPlusBold className="h-4 w-4 mr-2" />
                )}
                {isCreatingPrompt ? "Creating..." : "New Prompt"}
              </Button>

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
import { hprompt } from "@helicone/helicone";

const chatCompletion = await openai.chat.completions.create(
  {
    messages: [
      {
        role: "user",
        // 2: Add hprompt to any string, and nest any variable in additional brackets \`{}\`
        content: hprompt\`Write a story about \${{ scene }}\`,
      },
    ],
    model: "gpt-3.5-turbo",
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
          ) : null
        }
      />

      <div className="flex flex-col space-y-4 w-full py-2">
        {isLoading ? (
          <div className="flex flex-col w-full mt-16 justify-center items-center">
            <LoadingAnimation title="Loading Prompts..." />
          </div>
        ) : (
          <>
            {(hasAccess || hasLimitedAccess) && (
              <div
                id="util"
                className="flex flex-row justify-between items-center px-8"
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

            {hasAccess && (prompts?.length ?? 0) === 0 ? (
              <div className="flex items-center justify-center w-full h-full absolute top-0 left-0">
                <div className="flex flex-col items-center justify-center gap-12 px-4 text-center max-w-lg">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-2xl font-semibold">
                      No prompts created yet
                    </h3>

                    <p className="text-gray-500 text-md">
                      Get started by creating your first prompt. You can design,
                      test, and version control your AI prompts all in one
                      place.
                    </p>
                  </div>
                  <div className="flex flex-row gap-2">
                    <Button
                      variant="action"
                      className="gap-2"
                      onClick={handleCreatePrompt}
                      disabled={isCreatingPrompt}
                    >
                      {isCreatingPrompt ? (
                        <PiSpinnerGapBold className="animate-spin h-4 w-4 mr-2" />
                      ) : (
                        <PiPlusBold className="h-4 w-4 mr-2" />
                      )}
                      {isCreatingPrompt ? "Creating..." : "Create First Prompt"}
                    </Button>

                    <Link
                      href="https://docs.helicone.ai/features/prompts"
                      target="_blank"
                    >
                      <Button
                        variant="outline"
                        className="gap-2 text-slate-700"
                      >
                        View Docs
                        <SquareArrowOutUpRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : filteredPrompts && (hasAccess || hasLimitedAccess) ? (
              searchParams.get("view") === "card" ? (
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
                <SimpleTable
                  data={filteredPrompts}
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
                                  <span className="font-semibold">
                                    in the UI
                                  </span>
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
                                  <span className="font-semibold">in code</span>
                                  . You won&apos;t be able to edit this from the
                                  UI.
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
              <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <PromptsPreview />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default PromptsPage;
