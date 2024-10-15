import { useOrg } from "@/components/layout/organizationContext";
import { ProFeatureWrapper } from "@/components/shared/ProBlockerComponents/ProFeatureWrapper";
import { InfoBox } from "@/components/ui/helicone/infoBox";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import {
  ChevronDownIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  Square2StackIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { TextInput } from "@tremor/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useJawnClient } from "../../../lib/clients/jawnHook";
import { usePrompts } from "../../../services/hooks/prompts/prompts";
import AuthHeader from "../../shared/authHeader";
import LoadingAnimation from "../../shared/loadingAnimation";
import useNotification from "../../shared/notification/useNotification";
import { SimpleTable } from "../../shared/table/simpleTable";
import ThemedTabs from "../../shared/themed/themedTabs";
import useSearchParams from "../../shared/utils/useSearchParams";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import HcBadge from "../../ui/hcBadge";
import HcButton from "../../ui/hcButton";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Switch } from "../../ui/switch";
import { Textarea } from "../../ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { MODEL_LIST } from "../playground/new/modelList";
import { PricingCompare } from "../pricing/pricingCompare";
import { DiffHighlight } from "../welcome/diffHighlight";
import PromptCard from "./promptCard";
import PromptDelete from "./promptDelete";
import PromptUsageChart from "./promptUsageChart";
import { UpgradeToProCTA } from "../pricing/upgradeToProCTA";
import { IslandContainer } from "@/components/ui/islandContainer";

interface PromptsPageProps {
  defaultIndex: number;
}

const PromptsPage = (props: PromptsPageProps) => {
  const { prompts, isLoading, refetch } = usePrompts();
  const [searchName, setSearchName] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [imNotTechnical, setImNotTechnical] = useState<boolean>(false);
  const [newPromptName, setNewPromptName] = useState<string>("");
  const [newPromptModel, setNewPromptModel] = useState(MODEL_LIST[0].value);
  const [newPromptContent, setNewPromptContent] = useState("");
  const [promptVariables, setPromptVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );
  const newPromptInputRef = useRef<HTMLInputElement>(null);
  const notification = useNotification();
  const filteredPrompts = prompts?.filter((prompt) =>
    prompt.user_defined_id.toLowerCase().includes(searchName.toLowerCase())
  );
  const jawn = useJawnClient();

  const extractVariables = (content: string) => {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1].trim());
    }
    return Array.from(variables);
  };

  const replaceVariablesWithTags = useCallback((content: string) => {
    return content.replace(
      /\{\{([^}]+)\}\}/g,
      (match, p1) => `<helicone-prompt-input key="${p1.trim()}" />`
    );
  }, []);

  const createPrompt = async (userDefinedId: string) => {
    // Check if a prompt with this name already exists
    const existingPrompt = prompts?.find(
      (prompt) =>
        prompt.user_defined_id.toLowerCase() === userDefinedId.toLowerCase()
    );

    if (existingPrompt) {
      notification.setNotification(
        `A prompt with the name "${userDefinedId}" already exists`,
        "error"
      );
      return;
    }

    // Prepare the prompt data with variable values
    const promptData = {
      model: newPromptModel,
      messages: [
        {
          role: "user",
          content: [
            {
              text: replaceVariablesWithTags(newPromptContent),
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
  const org = useOrg();

  const hasAccess = useMemo(() => {
    return (
      org?.currentOrg?.tier === "growth" ||
      org?.currentOrg?.tier === "enterprise" ||
      org?.currentOrg?.tier === "pro" ||
      (org?.currentOrg?.tier === "pro-20240913" &&
        (org?.currentOrg?.stripe_metadata as { addons?: { prompts?: boolean } })
          ?.addons?.prompts)
    );
  }, [org?.currentOrg?.tier, org?.currentOrg?.stripe_metadata]);

  const hasLimitedAccess = useMemo(() => {
    return !hasAccess && (prompts?.length ?? 0) > 0;
  }, [hasAccess, prompts?.length]);

  const [showPricingCompare, setShowPricingCompare] = useState(false);

  return (
    <IslandContainer>
      <div className="flex flex-col space-y-4 w-full">
        <AuthHeader
          isWithinIsland={true}
          title={
            <div className="flex items-center gap-2">
              Prompts <HcBadge title="Beta" size="sm" />
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
                      <DialogTrigger asChild className="w-min">
                        {hasAccess ? (
                          <HcButton
                            variant={"primary"}
                            size={"sm"}
                            title={"Create new prompt"}
                            icon={DocumentPlusIcon}
                          />
                        ) : (
                          <ProFeatureWrapper
                            featureName="Prompts"
                            enabled={false}
                          >
                            <HcButton
                              variant={"primary"}
                              size={"sm"}
                              title={"Create new prompt"}
                              icon={DocumentPlusIcon}
                            />
                          </ProFeatureWrapper>
                        )}
                      </DialogTrigger>
                      <DialogContent className="w-[900px] ">
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
                        <div className="flex flex-col space-y-4 h-[570px] justify-between">
                          {imNotTechnical ? (
                            <>
                              <div className="flex flex-col space-y-6">
                                <div className="flex flex-col space-y-2">
                                  <Label
                                    className="text-lg"
                                    htmlFor="new-prompt-name"
                                  >
                                    Name
                                  </Label>
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
                                  <Label
                                    className="text-lg"
                                    htmlFor="new-prompt-model"
                                  >
                                    Model
                                  </Label>
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
                                  <Label
                                    className="text-lg"
                                    htmlFor="new-prompt-content"
                                  >
                                    Prompt
                                  </Label>
                                  <Textarea
                                    id="new-prompt-content"
                                    value={newPromptContent}
                                    onChange={(e) => {
                                      const newContent = e.target.value;
                                      setNewPromptContent(newContent);
                                      const extractedVariables =
                                        extractVariables(newContent);
                                      setPromptVariables(extractedVariables);

                                      // Initialize or remove variable values
                                      setVariableValues((prevValues) => {
                                        const newValues: Record<
                                          string,
                                          string
                                        > = {};
                                        extractedVariables.forEach(
                                          (variable) => {
                                            newValues[variable] =
                                              prevValues[variable] || "";
                                          }
                                        );
                                        return newValues;
                                      });
                                    }}
                                    placeholder="Type your prompt here"
                                    rows={4}
                                  />
                                  <p className="text-sm text-gray-500">
                                    Use &#123;&#123; sample_variable
                                    &#125;&#125; to insert variables into your
                                    prompt.
                                  </p>
                                </div>
                                {promptVariables.length > 0 && (
                                  <div className="flex flex-col space-y-2">
                                    <Label className="text-lg">Variables</Label>
                                    <div className="flex flex-col space-y-2">
                                      {promptVariables.map(
                                        (variable, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center space-x-2"
                                          >
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                              {variable}:
                                            </span>
                                            <input
                                              type="text"
                                              value={
                                                variableValues[variable] || ""
                                              }
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                setVariableValues(
                                                  (prevValues) => ({
                                                    ...prevValues,
                                                    [variable]: value,
                                                  })
                                                );
                                              }}
                                              className="border rounded px-2 py-1 text-sm flex-grow"
                                            />
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
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
    // 4. Add Prompt Id Header
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
              )}

              {filteredPrompts && (hasLimitedAccess || hasAccess) ? (
                searchParams.get("view") === "card" ? (
                  <ul className="w-full h-full grid grid-cols-2 xl:grid-cols-4 gap-4">
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
                          <div className="text-gray-500">
                            {prompt.metadata?.createdFromUi === true ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-center text-center bg-[#F1F5F9] rounded-md p-2 border border-[#CBD5E1] text-black max-w-28">
                                    <PencilIcon className="h-4 w-4 mr-1" />
                                    <p>Editable</p>
                                  </div>
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
                                  <div className="flex items-center justify-center bg-[#F1F5F9] rounded-md p-2 border border-[#CBD5E1] text-black max-w-28">
                                    <EyeIcon className="h-4 w-4 mr-1" />
                                    <p>View only</p>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent align="center">
                                  <p>
                                    This prompt was created{" "}
                                    <span className="font-semibold">
                                      in code
                                    </span>
                                    . You won&apos;t be able to edit this from
                                    the UI.
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
              ) : hasAccess || hasLimitedAccess ? (
                <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                  <Card className="max-w-4xl">
                    <CardHeader>
                      <CardTitle>Get Started with Prompts</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        You haven&apos;t created any prompts yet. Let&apos;s get
                        started!
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <InfoBox>
                        <p className="text-sm font-medium">
                          Version prompts, create prompt templates, and run
                          experiments to improve prompt outputs.
                        </p>
                      </InfoBox>
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex space-x-2 mb-2">
                          <Button variant="outline" size="sm">
                            Code Example
                          </Button>
                        </div>

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
                    </CardContent>
                    <CardFooter className="flex flex-col items-start">
                      <div className="space-x-2 mt-5">
                        <Button variant="outline" asChild>
                          <Link href="https://docs.helicone.ai/features/prompts">
                            View documentation
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              ) : org?.currentOrg?.tier === "pro-20240913" ? (
                <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                  <Card className="max-w-4xl">
                    <CardHeader>
                      <CardTitle>Need Prompts?</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        The Prompts feature is not included in the Pro plan by
                        default. However, you can add it to your plan as an
                        optional extra.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <InfoBox>
                        <p className="text-sm font-medium">
                          Version prompts, create prompt templates, and run
                          experiments to improve prompt outputs.
                        </p>
                      </InfoBox>
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex space-x-2 mb-2">
                          <Button variant="outline" size="sm">
                            Code
                          </Button>
                        </div>

                        <DiffHighlight
                          code={`
// 1. Add this line
import { hpf, hpstatic } from "@helicone/prompts";

const chatCompletion = await openai.chat.completions.create(
  {
    messages: [
      {
        role: "system",
        // 2. Use hpstatic for static prompts
        content: hpstatic\`You are a creative storyteller.\`,
      },
      {
        role: "user",
        // 3: Add hpf to any string, and nest any variable in additional brackets \`{}\`
        content: hpf\`Write a story about \${{ scene }}\`,
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
                    </CardContent>
                    <CardFooter className="flex flex-col items-center">
                      <div className="w-full">
                        <UpgradeToProCTA
                          defaultPrompts={true}
                          showAddons={true}
                        />
                      </div>
                      <div className="space-x-2 mt-5">
                        <Button variant="outline" asChild>
                          <Link href="https://docs.helicone.ai/features/prompts">
                            View documentation
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              ) : (
                <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                  <Card className="max-w-4xl">
                    <CardHeader>
                      <CardTitle>Need Prompts?</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        The Free plan does not include the Prompts feature,
                        upgrade to Pro to enable Prompts.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <InfoBox>
                        <p className="text-sm font-medium">
                          Version prompts, create prompt templates, and run
                          experiments to improve prompt outputs.
                        </p>
                      </InfoBox>
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex space-x-2 mb-2">
                          <Button variant="outline" size="sm">
                            Code
                          </Button>
                        </div>

                        <DiffHighlight
                          code={`
// 1. Add this line
import { hpf, hpstatic } from "@helicone/prompts";

const chatCompletion = await openai.chat.completions.create(
  {
    messages: [
      {
        role: "system",
        // 2. Use hpstatic for static prompts
        content: hpstatic\`You are a creative storyteller.\`,
      },
      {
        role: "user",
        // 3: Add hpf to any string, and nest any variable in additional brackets \`{}\`
        content: hpf\`Write a story about \${{ scene }}\`,
      },
    ],
    model: "gpt-3.5-turbo",
  },
  {
    // 4. Add Prompt Id Header
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
                    </CardContent>
                    <CardFooter className="flex flex-col items-start">
                      <Button
                        variant="link"
                        className="px-0 mb-4"
                        onClick={() =>
                          setShowPricingCompare(!showPricingCompare)
                        }
                      >
                        Compare my plan with Pro + Prompts{" "}
                        <ChevronDownIcon
                          className={`ml-1 h-4 w-4 transition-transform ${
                            showPricingCompare ? "rotate-180" : ""
                          }`}
                        />
                      </Button>
                      <div className="w-full">
                        {showPricingCompare && (
                          <PricingCompare featureName="Prompts" />
                        )}
                      </div>
                      <div className="space-x-2 mt-5">
                        <Button variant="outline" asChild>
                          <Link href="https://docs.helicone.ai/features/prompts">
                            View documentation
                          </Link>
                        </Button>
                        {showPricingCompare || (
                          <Button asChild>
                            <Link href="/settings/billing">
                              Start 14-day free trial
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </IslandContainer>
  );
};

export default PromptsPage;
