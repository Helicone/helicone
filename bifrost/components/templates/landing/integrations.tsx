"use client";

import { ISLAND_WIDTH } from "@/lib/utils";
import { DiffHighlight } from "@/components/shared/diffHighlight";
import { cn } from "@/lib/utils";
import { ArrowUpRightIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ChevronRight } from "lucide-react";

interface IntegrationsProps { }

const Integrations = (props: IntegrationsProps) => {
  const { } = props;

  const PROVIDERS: {
    name: string;
    // logo is a react element
    logo: JSX.Element;
    integrations: Record<
      string,
      {
        language: string;
        code: string;
      }
    >;
    href: string;
  }[] = [
      {
        name: "OpenAI",
        logo: (
          <div className="p-3">
            <Image
              src={"/static/openai.webp"}
              alt={"OpenAI"}
              width={2048}
              height={2048}
            />
          </div>
        ),
        href: "https://docs.helicone.ai/integrations/openai/javascript#openai-javascript-sdk-integration",
        integrations: {
          javascript: {
            language: "tsx",
            code: `import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: \`https://oai.helicone.ai/v1/\$\{HELICONE_API_KEY\}/\`
});`,
          },
          python: {
            language: "python",
            code: `from openai import OpenAI    

client = OpenAI(
  api_key=OPENAI_API_KEY, 
  base_url=f"https://oai.helicone.ai/v1/{HELICONE_API_KEY}/"
)`,
          },
          langchain: {
            language: "python",
            code: `llm = ChatOpenAI(
  openai_api_base=f"https://oai.helicone.ai/v1/{HELICONE_API_KEY}/"
  openai_api_key=OPENAI_API_KEY
)`,
          },
          langchainJS: {
            language: "tsx",
            code: `const llm = new OpenAI({
  modelName: "gpt-3.5-turbo",
  configuration: {
    basePath: "https://oai.helicone.ai/v1/HELICONE_API_KEY/"
});`,
          },
        },
      },
      {
        name: "Anthropic",
        logo: (
          <div className="p-3">
            <Image
              src={"/static/anthropic.webp"}
              alt={"Anthropic"}
              width={2048}
              height={2048}
            />
          </div>
        ),
        href: "https://docs.helicone.ai/integrations/anthropic/javascript",
        integrations: {
          javascript: {
            language: "tsx",
            code: `import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
  baseURL: "https://anthropic.helicone.ai/\$\{HELICONE_API_KEY\}/\",
});`,
          },
          python: {
            language: "python",
            code: `import anthropic

client = anthropic.Anthropic(
  api_key=ANTHROPIC_API_KEY,
  base_url="https://anthropic.helicone.ai/{HELICONE_API_KEY}/"
)`,
          },
          langchain: {
            language: "python",
            code: `const llm = new ChatAnthropic({
  modelName: "claude-2",
  anthropicApiKey: "ANTHROPIC_API_KEY",
  clientOptions: {
    baseURL: "https://anthropic.helicone.ai/{HELICONE_API_KEY}/",
  },
});
`,
          },
        },
      },
      {
        name: "Azure",
        logo: (
          <div className="p-3">
            <Image
              src={"/static/azure.webp"}
              alt={"Azure"}
              width={2048}
              height={2048}
            />
          </div>
        ),
        href: "https://docs.helicone.ai/integrations/azure/javascript",
        integrations: {
          javascript: {
            language: "tsx",
            code: `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://oai.helicone.ai/openai/deployments/[DEPLOYMENT_NAME]",
  defaultHeaders: {
    "Helicone-Auth": Bearer <HELICONE_API_KEY>,
    "Helicone-OpenAI-API-Base": "https://[AZURE_DOMAIN].openai.azure.com",
    "api-key": "[AZURE_API_KEY]",
  },
  defaultQuery: { 
    "api-version": "[API_VERSION]" 
  },
});`,
          },
          python: {
            language: "python",
            code: `import OpenAI 

client = OpenAI(
  api_key="[AZURE_OPENAI_API_KEY]",
  base_url="https://oai.helicone.ai/openai/deployments/[DEPLOYMENT]",
  default_headers={
    "Helicone-OpenAI-Api-Base": "https://[AZURE_DOMAIN].openai.azure.com",
    "Helicone-Auth": Bearer <HELICONE_API_KEY>,
    "api-key": "[AZURE_OPENAI_API_KEY]",
  },
  default_query={
    "api-version": "[API_VERSION]"
  }
)`,
          },
          langchain: {
            language: "python",
            code: `from langchain.chat_models import AzureChatOpenAI

helicone_headers = {
  "Helicone-Auth": Bearer <HELICONE_API_KEY>,
  "Helicone-OpenAI-Api-Base": "https://<model_name>.openai.azure.com/"
}

self.model = AzureChatOpenAI(
  openai_api_base="https://oai.helicone.ai"
  deployment_name="gpt-35-turbo",
  openai_api_key=<AZURE_OPENAI_API_KEY>,
  openai_api_version="2023-05-15",
  openai_api_type="azure",
  max_retries=max_retries,
  headers=helicone_headers,
  **kwargs,
)`,
          },
          langchainJS: {
            language: "tsx",
            code: `const model = new ChatOpenAI({
  azureOpenAIApiKey: "[AZURE_OPENAI_API_KEY]",
  azureOpenAIApiDeploymentName: "openai/deployments/gpt-35-turbo",
  azureOpenAIApiVersion: "2023-03-15-preview",
  azureOpenAIBasePath: "https://oai.helicone.ai",
  configuration: {
    organization: "[organization]",
    baseOptions: {
      headers: {
        "Helicone-Auth": Bearer <HELICONE_API_KEY>,
        "Helicone-OpenAI-Api-Base":
          "https://[YOUR_AZURE_DOMAIN].openai.azure.com",
      },
    },
  },
});`,
          },
        },
      },

      {
        name: "Gemini",
        logo: (
          <div className="p-3">
            <Image
              src={"/static/gemini.webp"}
              alt={"Gemini"}
              width={2048}
              height={2048}
            />
          </div>
        ),
        integrations: {
          curl: {
            language: "shell",
            code: `curl --request POST \\
  --url "https://gateway.helicone.ai/v1beta/models/model-name:generateContent?key=$\{GOOGLE_GENERATIVE_API_KEY\}" \\
  --header "Content-Type: application/json" \\
  --header "Helicone-Auth: Bearer $\{HELICONE_API_KEY\}" \\
  --header "Helicone-Target-URL: https://generativelanguage.googleapis.com" \\
  --data '{
    "contents": [{
      "parts":[{
        "text": "Write a story about a magic backpack."
      }]
    }]
  }'`,
          },
        },
        href: "https://docs.helicone.ai/integrations/gemini/api/curl",
      },
      {
        name: "Vercel AI SDK",
        logo: (
          <div className="p-3">
            <Image
              src={"/static/vercel.webp"}
              alt={"Vercel AI"}
              width={2048}
              height={2048}
            />
          </div>
        ),
        integrations: {},
        href: "https://docs.helicone.ai/getting-started/integration-method/vercelai",
      },
      {
        name: "OpenRouter",
        logo: (
          <div className="p-3">
            <Image
              src={"/static/openrouter.webp"}
              alt={"Open Router"}
              width={2048}
              height={2048}
            />
          </div>
        ),
        integrations: {
          javascript: {
            language: "tsx",
            code: `fetch("https://openrouter.helicone.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: \`Bearer $\{OPENROUTER_API_KEY\}\`,
    "Helicone-Auth": \`Bearer $\{HELICONE_API_KEY\}\`,
    "HTTP-Referer": \`$\{YOUR_SITE_URL\}\`, // Optional, for including your app on openrouter.ai rankings.
    "X-Title": \`$\{YOUR_SITE_NAME\}\`, // Optional. Shows in rankings on openrouter.ai.
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "openai/gpt-3.5-turbo", // Optional (user controls the default),
    messages: [{ role: "user", content: "What is the meaning of life?" }],
    stream: true,
  }),
});`,
          },
        },
        href: "https://docs.helicone.ai/getting-started/integration-method/openrouter",
      },
      {
        name: "TogetherAI",
        logo: (
          <div className="p-3">
            <Image
              src={"/static/together.webp"}
              alt={"TogetherAI"}
              width={2048}
              height={2048}
            />
          </div>
        ),
        integrations: {},
        href: "https://docs.helicone.ai/getting-started/integration-method/together",
      },
      {
        name: "AWS Bedrock",
        logo: (
          <div className="p-3">
            <Image
              src={"/static/aws-bedrock.webp"}
              alt={"AWS Bedrock"}
              width={2048}
              height={2048}
            />
          </div>
        ),
        integrations: {},
        href: "https://docs.helicone.ai/integrations/bedrock/",
      },
      {
        name: "LangChain",
        logo: (
          <div className="p-3">
            <Image
              src={"/static/langchain.webp"}
              alt={"LangChain"}
              width={2048}
              height={2048}
            />
          </div>
        ),
        integrations: {},
        href: "https://docs.helicone.ai/integrations/openai/langchain",
      },
      {
        name: "Groq",
        logo: (
          <div className="p-3">
            <Image
              src={"/static/groq.webp"}
              alt={"Groq"}
              width={2048}
              height={2048}
            />
          </div>
        ),
        integrations: {},
        href: "https://docs.helicone.ai/integrations/groq/",
      },
      {
        name: "LiteLLM",
        logo: (
          <div className="p-3">
            <Image
              src={"/static/litellm.webp"}
              alt={"LiteLLM"}
              width={2048}
              height={2048}
            />
          </div>
        ),
        integrations: {},
        href: "https://docs.helicone.ai/getting-started/integration-method/litellm",
      },
    ];

  const [currentProvider, setCurrentProvider] = useState("OpenAI");

  const [currentIntegration, setCurrentIntregration] = useState("javascript");

  const selectedProvider = PROVIDERS.find(
    (provider) => provider.name === currentProvider
  );

  const currentCodeBlock = selectedProvider?.integrations[currentIntegration];

  return (
    <div className={cn(ISLAND_WIDTH, "py-16 md:py-32 flex flex-col gap-10")}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-y-8 justify-between items-center">
          <div className="flex flex-col gap-5">
            <h2 className="text-3xl sm:text-5xl font-semibold text-accent-foreground">
              Get integrated in <span className="text-brand">seconds</span>
            </h2>
            <p className="text-lg font-normal sm:text-xl text-muted-foreground">
              The simplest integration that connects seamlessly to any LLM provider and framework.{" "}
            </p>
            <div className="flex flex-col items-start gap-1">
              <div className="flex flex-wrap">
                {PROVIDERS.map((provider) => (
                  <div
                    key={provider.name}
                    className={cn(
                      "size-20 rounded-md p-2.5 hover:bg-sky-50 transition-colors ease-in-out duration-200 cursor-pointer",
                      selectedProvider?.name === provider.name ? "bg-sky-100" : ""
                    )}
                    onClick={() => {
                      if (
                        Object.keys(provider.integrations).length == 0 ||
                        window.matchMedia("(max-width: 768px)").matches
                      ) {
                        window.open(provider.href, "_blank");
                        return;
                      }
                      setCurrentProvider(provider.name);
                      if (!provider.integrations[currentIntegration]) {
                        if (provider.name === "Gemini") {
                          setCurrentIntregration("curl");
                        } else {
                          setCurrentIntregration("javascript");
                        }
                      }
                    }}
                  >
                    <div className="flex items-center justify-center bg-background border border-border rounded-md h-full">
                      {provider.logo}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
        <div className="border rounded-2xl hidden md:flex flex-col divide-y divide-gray-700">
          <div className="flex items-center justify-between py-2 px-8 bg-gray-900 rounded-t-2xl">
            <ul className="flex items-center space-x-0">
              {Object.keys(selectedProvider?.integrations || {}).map(
                (integration) => (
                  <li
                    key={integration}
                    className={`text-gray-300 cursor-pointer text-sm px-4 py-2 ${currentIntegration === integration
                      ? "border border-gray-500 rounded-lg bg-gray-700"
                      : ""
                      }`}
                    onClick={() => setCurrentIntregration(integration)}
                  >
                    {integration}
                  </li>
                )
              )}
            </ul>
            <button className="text-gray-300">
              <ClipboardIcon
                onClick={() => {
                  navigator.clipboard.writeText(currentCodeBlock?.code || "");
                  toast.success("Copied to clipboard");
                }}
                className="h-6 w-6"
              />
            </button>
          </div>
          <div className="w-full">
            <DiffHighlight
              code={currentCodeBlock?.code || ""}
              language={currentCodeBlock?.language || "tsx"}
            />
          </div>
        </div>
        <Toaster />
      </div>
      <div className="flex gap-2 items-center md:gap-4">
        <Link href="/signup">
          <Button
            className="bg-brand p-5 text-base md:text-lg md:py-4 lg:py-6 lg:px-6 lg:text-md gap-2 rounded-lg items-center z-[10]"
          >
            Integrate today
            <ChevronRight className="size-5 md:size-6" />
          </Button>
        </Link>
        <Link href="https://docs.helicone.ai/getting-started/quick-start#quick-start" target="_blank" rel="noopener">
          <Button
            variant="ghost"
            className="p-5 text-base md:text-lg md:py-4 lg:py-6 lg:px-6 lg:text-md gap-2 rounded-lg items-center z-[10]"
          >
            Other providers
            <ArrowUpRight className="size-4 md:size-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Integrations;
