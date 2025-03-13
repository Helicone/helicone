import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Provider } from "@/packages/cost/unified/types";
import { PromptState } from "@/types/prompt-state";
import {
  getEnvFileExample,
  getPromptDeploymentExample,
  providerEnvVars,
} from "@/utils/promptDeploy";
import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PiArrowUpRightBold, PiRocketLaunchBold } from "react-icons/pi";
import { DiffHighlight } from "../../welcome/diffHighlight";

import { P, Small } from "@/components/ui/typography";

interface DeployDialogProps {
  promptId: string;
  userDefinedId: string;
  state: PromptState | null;
  isImportedFromCode?: boolean;
}
export default function DeployDialog({
  promptId,
  userDefinedId,
  state,
  isImportedFromCode,
}: DeployDialogProps) {
  const [showChatExample, setShowChatExample] = useState(false);

  if (!promptId) return null;

  const provider = state?.parameters?.provider as Provider;
  const inputs = state?.inputs || [];
  const hasVariables = inputs.length > 0;

  const examples = getPromptDeploymentExample(
    userDefinedId || "my-prompt-id",
    inputs,
    state?.parameters
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isImportedFromCode === true}
        >
          <PiRocketLaunchBold className="h-4 w-4 mr-2" />
          <span>Deploy</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-full max-w-4xl flex flex-col gap-4 items-center overflow-hidden bg-slate-100 dark:bg-slate-900">
        {/* Installation */}
        <div className="w-full flex flex-col">
          <div className="w-full flex flex-row justify-between items-center">
            <P className="font-semibold text-slate-700 dark:slate-300">
              Install
            </P>
          </div>
          <div className="w-full">
            <DiffHighlight
              maxHeight={false}
              minHeight={false}
              className="w-full"
              code="npm install @helicone/generate"
              language="bash"
              newLines={[]}
              oldLines={[]}
            />
          </div>
        </div>

        {/* Environment Variables */}
        {provider && (
          <>
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>
                Provider: {providerEnvVars[provider].name}
              </AlertTitle>
              <AlertDescription>
                Required environment variables:
              </AlertDescription>
              <div className="w-full">
                <DiffHighlight
                  maxHeight={false}
                  minHeight={false}
                  className="w-full"
                  code={
                    provider
                      ? getEnvFileExample(provider)
                      : "HELICONE_API_KEY=your-helicone-api-key"
                  }
                  language="bash"
                  newLines={[]}
                  oldLines={[]}
                />
              </div>
            </Alert>
          </>
        )}

        {/* Toggle between chat and non-chat examples */}
        <div className="w-full flex flex-col">
          <div className="w-full flex flex-row justify-between items-center">
            <P className="font-semibold text-slate-700 dark:slate-300">
              Deploy
            </P>
            <div className="w-full flex flex-row justify-end items-center gap-2">
              <Tabs
                defaultValue={showChatExample ? "chat" : "single"}
                onValueChange={(value) => setShowChatExample(value === "chat")}
              >
                <TabsList asPill size="xs">
                  <TabsTrigger asPill value="single">
                    Single
                  </TabsTrigger>
                  <TabsTrigger asPill value="chat">
                    Chat
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Show either simple usage or with variables based on inputs */}
          {!showChatExample && (
            <div className="w-full">
              <DiffHighlight
                maxHeight={false}
                minHeight={false}
                className="w-full"
                code={
                  hasVariables
                    ? examples.variablesExample
                    : examples.simpleExample
                }
                language="typescript"
                newLines={[]}
                oldLines={[]}
              />
            </div>
          )}

          {/* In a Chat */}
          {showChatExample && (
            <div className="w-full">
              <DiffHighlight
                maxHeight={false}
                minHeight={false}
                className="w-full"
                code={examples.chatExample}
                language="typescript"
                newLines={[]}
                oldLines={[]}
              />
            </div>
          )}
        </div>

        <Link
          href="https://docs.helicone.ai/features/prompts/generate"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex flex-row gap-0.5 items-center text-heliblue hover:underline"
        >
          <Small className="font-semibold text-heliblue">
            Read Full Documentation
          </Small>
          <PiArrowUpRightBold className=" h-4 w-4" />
        </Link>
      </DialogContent>
    </Dialog>
  );
}
