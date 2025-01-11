import { useUser } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { generateAPIKeyHelper } from "../../../../utlis/generateAPIKeyHelper";
import { useOrg } from "../../../layout/org/organizationContext";
import useNotification from "../../../shared/notification/useNotification";
import Image from "next/image";
import { clsx } from "../../../shared/clsx";
import CodeSnippet from "./providerIntegrations.tsx/openAISnippets";
import AzureSnippets from "./providerIntegrations.tsx/azureSnippets";
import AnthropicSnippets from "./providerIntegrations.tsx/anthropicSnippets";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DiffHighlight } from "../diffHighlight";
import { DialogFooter } from "@/components/ui/dialog";
import { ArrowUpRightIcon } from "lucide-react";

const ASYNC_CODE_CONVERTS = {
  "node.js": (key: string) => `
import { HeliconeAsyncLogger } from "@helicone/async";
import OpenAI from "openai";  // Import your preferred providers
import Anthropic from "@anthropic-ai/sdk";

const logger = new HeliconeAsyncLogger({
  apiKey: "Bearer ${key}",
  providers: { openAI: OpenAI, anthropic: Anthropic }  // Supports many providers
});
logger.init();
// your existing OpenAI code will work as-is
  `,
  python: (key: string) => `
from helicone_async import HeliconeAsyncLogger
from openai import OpenAI  # Import your preferred providers
from anthropic import Anthropic

logger = HeliconeAsyncLogger(
    api_key="Bearer ${key}",
    providers=[OpenAI, Anthropic]  # Supports many providers
)
logger.init()
# your existing OpenAI code will work as-is
  `,
};

const GenerateAPIKey = ({
  selectedIntegrationMethod,
  setCurrentStep,
}: {
  selectedIntegrationMethod: "async" | "proxy";
  setCurrentStep: (step: number) => void;
}) => {
  const user = useUser();

  const { setNotification } = useNotification();

  const org = useOrg();

  const [selectedProvider, setSelectedProvider] = useState<
    "openai" | "azure" | "anthropic"
  >("openai");
  const [apiKey, setApiKey] = useState<string>("");
  const [asyncLang, setAsyncLang] = useState<"node.js" | "python">("node.js");

  const renderProviderObject = {
    openai: <CodeSnippet apiKey={apiKey !== "" ? apiKey : undefined} />,
    azure: <AzureSnippets apiKey={apiKey !== "" ? apiKey : undefined} />,
    anthropic: (
      <AnthropicSnippets apiKey={apiKey !== "" ? apiKey : undefined} />
    ),
  };

  useEffect(() => {
    const generateKey = async () => {
      if (!user) return;
      if (apiKey) return;
      const { res: promiseRes, apiKey: generatedApiKey } = generateAPIKeyHelper(
        "rw",
        org?.currentOrg?.organization_type ?? "",
        "Main",
        window.location.hostname.includes("eu."),
        false
      );

      const res = await promiseRes;

      if (!res.response.ok) {
        setNotification("Failed to generate API key", "error");
        console.error(await res.response.text());
      }

      setApiKey(generatedApiKey);
    };

    generateKey();
  }, [
    user,
    org?.currentOrg?.organization_type,
    apiKey,
    setApiKey,
    setNotification,
  ]);

  return (
    <div className="flex flex-col p-4 pt-0 h-full max-h-[calc(100vh-20rem)] overflow-y-auto">
      <div className="flex flex-col space-y-4 w-full">
        {selectedIntegrationMethod === "proxy" ? (
          <div className="flex flex-col space-y-2">
            <div>{renderProviderObject[selectedProvider]}</div>
          </div>
        ) : (
          <>
            {selectedIntegrationMethod === "async" && (
              <>
                <div className="mt-4">
                  <DiffHighlight
                    code={ASYNC_CODE_CONVERTS[asyncLang](apiKey)}
                    language={asyncLang}
                    newLines={[]}
                    oldLines={[]}
                    minHeight={true}
                  />
                </div>

                <div className="mt-2">
                  <div className="flex overflow-x-auto py-2 w-full no-scrollbar">
                    <div className="flex gap-2">
                      <Button
                        variant={"outline"}
                        size="sm"
                        className={
                          asyncLang === "node.js"
                            ? "bg-slate-200 border-slate-200 dark:bg-slate-800 dark:border-slate-800"
                            : ""
                        }
                        onClick={() => setAsyncLang("node.js")}
                      >
                        Node.js
                      </Button>
                      <Button
                        variant={"outline"}
                        size="sm"
                        className={
                          asyncLang === "python"
                            ? "bg-slate-200 border-slate-200 dark:bg-slate-800 dark:border-slate-800"
                            : ""
                        }
                        onClick={() => setAsyncLang("python")}
                      >
                        Python
                      </Button>
                      <Link
                        href="https://docs.helicone.ai/getting-started/integration-method/openllmetry#supported-languages"
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <Button variant="outline">
                          <div className="relative flex items-center w-12 h-4">
                            <Image
                              src="/assets/home/providers/lemonfox.png"
                              alt={"Anthropic"}
                              width={24}
                              height={24}
                              quality={100}
                              className="bg-transparent absolute left-0 z-40 rounded-full"
                            />
                            <Image
                              src="/assets/home/providers/llama2.png"
                              alt={"Anthropic"}
                              width={24}
                              height={24}
                              quality={100}
                              className="bg-transparent absolute left-2 z-30 rounded-xl"
                            />
                            <Image
                              src="/assets/home/providers/anyscale.jpeg"
                              alt={"Anthropic"}
                              width={24}
                              height={24}
                              quality={100}
                              className="bg-transparent absolute left-4 z-20 rounded-xl"
                            />
                          </div>
                          <span className="inline-flex items-center gap-1 text-sm text-slate-900 dark:text-slate-100">
                            More{" "}
                            <ArrowUpRightIcon className="w-3 h-3 text-slate-500" />
                          </span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {selectedIntegrationMethod === "proxy" && (
          <div className="flex flex-wrap gap-4 w-full">
            <Button
              variant="outline"
              className={clsx(
                selectedProvider === "openai"
                  ? "bg-slate-200 border-slate-200 dark:bg-slate-800 dark:border-slate-800"
                  : "hover:bg-gray-50 dark:hover:bg-slate-800",
                "gap-2"
              )}
              onClick={() => setSelectedProvider("openai")}
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M26.153 11.46a6.888 6.888 0 0 0-.608-5.73 7.117 7.117 0 0 0-3.29-2.93 7.238 7.238 0 0 0-4.41-.454 7.065 7.065 0 0 0-2.41-1.742A7.15 7.15 0 0 0 12.514 0a7.216 7.216 0 0 0-4.217 1.346 7.061 7.061 0 0 0-2.603 3.539 7.12 7.12 0 0 0-2.734 1.188A7.012 7.012 0 0 0 .966 8.268a6.979 6.979 0 0 0 .88 8.273 6.89 6.89 0 0 0 .607 5.729 7.117 7.117 0 0 0 3.29 2.93 7.238 7.238 0 0 0 4.41.454 7.061 7.061 0 0 0 2.409 1.742c.92.404 1.916.61 2.923.604a7.215 7.215 0 0 0 4.22-1.345 7.06 7.06 0 0 0 2.605-3.543 7.116 7.116 0 0 0 2.734-1.187 7.01 7.01 0 0 0 1.993-2.196 6.978 6.978 0 0 0-.884-8.27Zm-10.61 14.71c-1.412 0-2.505-.428-3.46-1.215.043-.023.119-.064.168-.094l5.65-3.22a.911.911 0 0 0 .464-.793v-7.86l2.389 1.36a.087.087 0 0 1 .046.065v6.508c0 2.952-2.491 5.248-5.257 5.248ZM4.062 21.354a5.17 5.17 0 0 1-.635-3.516c.042.025.115.07.168.1l5.65 3.22a.928.928 0 0 0 .928 0l6.898-3.93v2.72a.083.083 0 0 1-.034.072l-5.711 3.255a5.386 5.386 0 0 1-4.035.522 5.315 5.315 0 0 1-3.23-2.443ZM2.573 9.184a5.283 5.283 0 0 1 2.768-2.301V13.515a.895.895 0 0 0 .464.793l6.897 3.93-2.388 1.36a.087.087 0 0 1-.08.008L4.52 16.349a5.262 5.262 0 0 1-2.475-3.185 5.192 5.192 0 0 1 .527-3.98Zm19.623 4.506-6.898-3.93 2.388-1.36a.087.087 0 0 1 .08-.008l5.713 3.255a5.28 5.28 0 0 1 2.054 2.118 5.19 5.19 0 0 1-.488 5.608 5.314 5.314 0 0 1-2.39 1.742v-6.633a.896.896 0 0 0-.459-.792Zm2.377-3.533a7.973 7.973 0 0 0-.168-.099l-5.65-3.22a.93.93 0 0 0-.928 0l-6.898 3.93V8.046a.083.083 0 0 1 .034-.072l5.712-3.251a5.375 5.375 0 0 1 5.698.241 5.262 5.262 0 0 1 1.865 2.28c.39.92.506 1.93.335 2.913ZM9.631 15.009l-2.39-1.36a.083.083 0 0 1-.046-.065V7.075c.001-.997.29-1.973.832-2.814a5.297 5.297 0 0 1 2.231-1.935 5.382 5.382 0 0 1 5.659.72 4.89 4.89 0 0 0-.168.093l-5.65 3.22a.913.913 0 0 0-.465.793l-.003 7.857Zm1.297-2.76L14 10.5l3.072 1.75v3.5L14 17.499l-3.072-1.75v-3.5Z"
                  fill="currentColor"
                ></path>
              </svg>
              <span className="text-sm text-slate-900 dark:text-slate-100">
                OpenAI
              </span>
            </Button>
            <Button
              variant="outline"
              className={clsx(
                selectedProvider === "azure"
                  ? "bg-slate-200 border-slate-200 dark:bg-slate-800 dark:border-slate-800"
                  : "hover:bg-gray-50 dark:hover:bg-slate-800",
                "gap-2"
              )}
              onClick={() => setSelectedProvider("azure")}
            >
              <Image
                src="/assets/landing/azure.svg.png"
                alt="Azure"
                width={20}
                height={20}
                quality={100}
                className="bg-transparent rounded-lg"
              />
              <span className="text-sm text-slate-900 dark:text-slate-100">
                Azure
              </span>
            </Button>

            <Button
              variant="outline"
              className={clsx(
                selectedProvider === "anthropic"
                  ? "bg-slate-200 border-slate-200 dark:bg-slate-800 dark:border-slate-800"
                  : "hover:bg-gray-50 dark:hover:bg-slate-800",
                "gap-2"
              )}
              onClick={() => setSelectedProvider("anthropic")}
            >
              <Image
                src="/assets/home/providers/anthropic.jpeg"
                alt="Anthropic"
                width={20}
                height={20}
                quality={100}
                className="bg-transparent rounded-xl"
              />
              <span className="text-sm text-slate-900 dark:text-slate-100">
                Anthropic
              </span>
            </Button>
            <Link
              href="https://docs.helicone.ai/getting-started/quick-start#quick-start"
              target="_blank"
              rel="noreferrer noopener"
            >
              <Button variant="outline">
                <div className="relative flex items-center w-12 h-4">
                  <Image
                    src="/assets/home/providers/lemonfox.png"
                    alt={"Anthropic"}
                    width={24}
                    height={24}
                    quality={100}
                    className="bg-transparent absolute left-0 z-40 rounded-full"
                  />
                  <Image
                    src="/assets/home/providers/llama2.png"
                    alt={"Anthropic"}
                    width={24}
                    height={24}
                    quality={100}
                    className="bg-transparent absolute left-2 z-30 rounded-xl"
                  />
                  <Image
                    src="/assets/home/providers/anyscale.jpeg"
                    alt={"Anthropic"}
                    width={24}
                    height={24}
                    quality={100}
                    className="bg-transparent absolute left-4 z-20 rounded-xl"
                  />
                </div>
                <span className="inline-flex items-center gap-1 text-sm text-slate-900 dark:text-slate-100">
                  More <ArrowUpRightIcon className="w-3 h-3 text-slate-500" />
                </span>
              </Button>
            </Link>
          </div>
        )}
      </div>
      <DialogFooter className="mt-10">
        <Button variant={"outline"} onClick={() => setCurrentStep(1)}>
          Go Back
        </Button>
        <Button onClick={() => setCurrentStep(3)}>Next</Button>
      </DialogFooter>
    </div>
  );
};

export default GenerateAPIKey;
