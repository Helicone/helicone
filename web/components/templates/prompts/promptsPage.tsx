import {
  BookOpenIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  Square2StackIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { Divider, TextInput } from "@tremor/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Fragment, useRef, useState, useCallback } from "react";
import { usePrompts } from "../../../services/hooks/prompts/prompts";
import { DiffHighlight } from "../welcome/diffHighlight";
import PromptCard from "./promptCard";
import { SimpleTable } from "../../shared/table/simpleTable";
import HcButton from "../../ui/hcButton";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import PromptDelete from "./promptDelete";
import LoadingAnimation from "../../shared/loadingAnimation";
import PromptUsageChart from "./promptUsageChart";
import ThemedTabs from "../../shared/themed/themedTabs";
import useSearchParams from "../../shared/utils/useSearchParams";
import AuthHeader from "../../shared/authHeader";
import HcBadge from "../../ui/hcBadge";
import { Switch } from "../../ui/switch";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import useNotification from "../../shared/notification/useNotification";
import { Textarea } from "../../ui/textarea";
import { Badge } from "../../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { MODEL_LIST } from "../playground/new/modelList";

interface PromptsPageProps {
  defaultIndex: number;
}

const PromptsPage = (props: PromptsPageProps) => {
  const { defaultIndex } = props;

  const { prompts, isLoading, refetch } = usePrompts();

  const [searchName, setSearchName] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [imNotTechnical, setImNotTechnical] = useState<boolean>(false);
  const [newPromptName, setNewPromptName] = useState<string>("");
  const [newPromptModel, setNewPromptModel] = useState(MODEL_LIST[0].value);
  const [newPromptContent, setNewPromptContent] = useState("");
  const [promptVariables, setPromptVariables] = useState<string[]>([]);
  const newPromptInputRef = useRef<HTMLInputElement>(null);
  const notification = useNotification();
  const filteredPrompts = prompts?.filter((prompt) =>
    prompt.user_defined_id.toLowerCase().includes(searchName.toLowerCase())
  );
  const jawn = useJawnClient();

  const createPrompt = async (userDefinedId: string) => {
    const promptData = {
      model: newPromptModel,
      messages: [
        {
          role: "user",
          content: [
            {
              text: newPromptContent,
              type: "text",
            },
          ],
        },
      ],
    };

    const res = await jawn.POST("/v1/prompt/create", {
      body: {
        userDefinedId,
        prompt: promptData,
      },
    });

    if (res.error || !res.data.data?.id) {
      notification.setNotification("Error creating prompt", "error");
    } else {
      notification.setNotification("Prompt created successfully", "success");
      router.push(`/prompts/${res.data.data?.id}`);
    }
  };

  const extractVariables = useCallback((content: string) => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = content.match(regex);
    if (matches) {
      const variables = matches.map((match) => match.slice(2, -2).trim());
      setPromptVariables(Array.from(new Set(variables)));
    } else {
      setPromptVariables([]);
    }
  }, []);

  return (
    <>
      <div className="flex flex-col space-y-4 w-full">
        <AuthHeader
          title={
            <div className="flex items-center gap-2">
              Prompts <HcBadge title="Beta" size="sm" />
            </div>
          }
        />

        <div className="flex flex-col space-y-4 w-full py-2">
          {isLoading ? (
            <div className="flex flex-col w-full mt-16 justify-center items-center">
              <LoadingAnimation title="Loading Prompts..." />
            </div>
          ) : prompts?.length === 0 ? (
            <div className="flex flex-col w-full mt-16 justify-center items-center">
              <div className="flex flex-col">
                <DocumentTextIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                <p className="text-xl text-black dark:text-white font-semibold mt-8">
                  No Prompts
                </p>
                <p className="text-sm text-gray-500 max-w-sm mt-2">
                  View our documentation to learn how to create a prompt.
                </p>
                <div className="mt-4">
                  <Link
                    href="https://docs.helicone.ai/features/prompts"
                    className="w-fit items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <BookOpenIcon className="h-4 w-4" />
                    View Docs
                  </Link>
                </div>
                <Divider>Or</Divider>

                <div className="mt-4">
                  <h3 className="text-xl text-black dark:text-white font-semibold">
                    TS/JS Quick Start
                  </h3>
                  <DiffHighlight
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
);
 `}
                    language="typescript"
                    newLines={[]}
                    oldLines={[]}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                id="util"
                className="flex flex-row justify-between items-center"
              >
                <div className="flex flex-row items-center space-x-2 w-full">
                  <div className="max-w-xs w-full">
                    <TextInput
                      icon={MagnifyingGlassIcon}
                      value={searchName}
                      onValueChange={(value) => setSearchName(value)}
                      placeholder="Search prompts..."
                    />
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <HcButton
                        variant={"primary"}
                        size={"sm"}
                        title={"Create new prompt"}
                        icon={DocumentPlusIcon}
                      />
                    </DialogTrigger>
                    <DialogContent className="w-[900px]">
                      <DialogHeader className="flex flex-row justify-between items-center">
                        <DialogTitle>Create a new prompt</DialogTitle>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="im-not-technical"
                            checked={imNotTechnical}
                            onCheckedChange={setImNotTechnical}
                          />
                          <Label htmlFor="im-not-technical">
                            I&apos;m not technical
                          </Label>
                        </div>
                      </DialogHeader>
                      <div className="flex flex-col space-y-4 h-[570px]">
                        {imNotTechnical ? (
                          <>
                            <div className="flex flex-col space-y-2">
                              <Label htmlFor="new-prompt-name">Name</Label>
                              <TextInput
                                id="new-prompt-name"
                                value={newPromptName}
                                onChange={(e) =>
                                  setNewPromptName(e.target.value)
                                }
                                ref={newPromptInputRef}
                              />
                            </div>
                            <div className="flex flex-col space-y-2">
                              <Label htmlFor="new-prompt-model">Model</Label>
                              <Select
                                value={newPromptModel}
                                onValueChange={setNewPromptModel}
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent>
                                  {MODEL_LIST.map((model) => (
                                    <SelectItem
                                      key={model.value}
                                      value={model.value}
                                    >
                                      {model.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <Label htmlFor="new-prompt-content">
                                Prompt Content
                              </Label>
                              <Textarea
                                id="new-prompt-content"
                                value={newPromptContent}
                                onChange={(e) => {
                                  setNewPromptContent(e.target.value);
                                  extractVariables(e.target.value);
                                }}
                                placeholder="Type your prompt here"
                                rows={4}
                              />
                              <p className="text-sm text-gray-500">
                                Use &#123;&#123; sample_variable &#125;&#125; to
                                insert variables into your prompt.
                              </p>
                            </div>
                            {promptVariables.length > 0 && (
                              <div className="flex flex-col space-y-2">
                                <Label>Your variables</Label>
                                <div className="flex flex-wrap gap-2">
                                  {promptVariables.map((variable, index) => (
                                    <Badge key={index} variant="secondary">
                                      {variable}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex justify-end items-center mt-4">
                              <Button
                                className="w-auto"
                                onClick={() => createPrompt(newPromptName)}
                              >
                                Create prompt
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-gray-500 mb-2">
                              TS/JS Quick Start
                            </p>
                            <DiffHighlight
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
);
                              `}
                              language="typescript"
                              newLines={[]}
                              oldLines={[]}
                              minHeight={false}
                            />
                          </>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
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
              {searchParams.get("view") === "card" ? (
                <ul className="w-full h-full grid grid-cols-2 xl:grid-cols-4 gap-4">
                  {filteredPrompts?.map((prompt, i) => (
                    <li key={i} className="col-span-1">
                      <PromptCard prompt={prompt} />
                    </li>
                  ))}
                </ul>
              ) : (
                <SimpleTable
                  data={filteredPrompts || []}
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
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PromptsPage;
