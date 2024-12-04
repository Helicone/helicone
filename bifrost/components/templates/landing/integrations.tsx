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

interface IntegrationsProps {}

const Integrations = (props: IntegrationsProps) => {
  const {} = props;

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
        <svg
          className="w-[2rem] m:w-[2.5rem] h-auto"
          width="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M26.153 11.46a6.888 6.888 0 0 0-.608-5.73 7.117 7.117 0 0 0-3.29-2.93 7.238 7.238 0 0 0-4.41-.454 7.065 7.065 0 0 0-2.41-1.742A7.15 7.15 0 0 0 12.514 0a7.216 7.216 0 0 0-4.217 1.346 7.061 7.061 0 0 0-2.603 3.539 7.12 7.12 0 0 0-2.734 1.188A7.012 7.012 0 0 0 .966 8.268a6.979 6.979 0 0 0 .88 8.273 6.89 6.89 0 0 0 .607 5.729 7.117 7.117 0 0 0 3.29 2.93 7.238 7.238 0 0 0 4.41.454 7.061 7.061 0 0 0 2.409 1.742c.92.404 1.916.61 2.923.604a7.215 7.215 0 0 0 4.22-1.345 7.06 7.06 0 0 0 2.605-3.543 7.116 7.116 0 0 0 2.734-1.187 7.01 7.01 0 0 0 1.993-2.196 6.978 6.978 0 0 0-.884-8.27Zm-10.61 14.71c-1.412 0-2.505-.428-3.46-1.215.043-.023.119-.064.168-.094l5.65-3.22a.911.911 0 0 0 .464-.793v-7.86l2.389 1.36a.087.087 0 0 1 .046.065v6.508c0 2.952-2.491 5.248-5.257 5.248ZM4.062 21.354a5.17 5.17 0 0 1-.635-3.516c.042.025.115.07.168.1l5.65 3.22a.928.928 0 0 0 .928 0l6.898-3.93v2.72a.083.083 0 0 1-.034.072l-5.711 3.255a5.386 5.386 0 0 1-4.035.522 5.315 5.315 0 0 1-3.23-2.443ZM2.573 9.184a5.283 5.283 0 0 1 2.768-2.301V13.515a.895.895 0 0 0 .464.793l6.897 3.93-2.388 1.36a.087.087 0 0 1-.08.008L4.52 16.349a5.262 5.262 0 0 1-2.475-3.185 5.192 5.192 0 0 1 .527-3.98Zm19.623 4.506-6.898-3.93 2.388-1.36a.087.087 0 0 1 .08-.008l5.713 3.255a5.28 5.28 0 0 1 2.054 2.118 5.19 5.19 0 0 1-.488 5.608 5.314 5.314 0 0 1-2.39 1.742v-6.633a.896.896 0 0 0-.459-.792Zm2.377-3.533a7.973 7.973 0 0 0-.168-.099l-5.65-3.22a.93.93 0 0 0-.928 0l-6.898 3.93V8.046a.083.083 0 0 1 .034-.072l5.712-3.251a5.375 5.375 0 0 1 5.698.241 5.262 5.262 0 0 1 1.865 2.28c.39.92.506 1.93.335 2.913ZM9.631 15.009l-2.39-1.36a.083.083 0 0 1-.046-.065V7.075c.001-.997.29-1.973.832-2.814a5.297 5.297 0 0 1 2.231-1.935 5.382 5.382 0 0 1 5.659.72 4.89 4.89 0 0 0-.168.093l-5.65 3.22a.913.913 0 0 0-.465.793l-.003 7.857Zm1.297-2.76L14 10.5l3.072 1.75v3.5L14 17.499l-3.072-1.75v-3.5Z"
            fill="currentColor"
          ></path>
        </svg>
      ),
      href: "https://docs.helicone.ai/integrations/openai/javascript#openai-javascript-sdk-integration",
      integrations: {
        "node.js": {
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
        "node.js": {
          language: "tsx",
          code: `import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  baseURL: "https://anthropic.helicone.ai/",
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    "Helicone-Auth": <HELICONE_API_KEY>,
  },
});
`,
        },
        python: {
          language: "python",
          code: `import anthropic

client = anthropic.Anthropic(
  api_key=os.environ.get("ANTHROPIC_API_KEY"),
  base_url="https://anthropic.helicone.ai"
  defaultHeaders={
    "Helicone-Auth": <HELICONE_API_KEY>,
  },
)
`,
        },
        langchain: {
          language: "python",
          code: `const llm = new ChatAnthropic({
  modelName: "claude-2",
  anthropicApiKey: "ANTHROPIC_API_KEY",
  clientOptions: {
    baseURL: "https://anthropic.helicone.ai/",
    defaultHeaders: {
      "Helicone-Auth": Bearer <HELICONE_API_KEY>,
    },
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
        "node.js": {
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
        "node.js": {
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
      name: "LiteLLM",
      logo: <div className="">🚅</div>,
      integrations: {},
      href: "https://docs.helicone.ai/getting-started/integration-method/litellm",
    },
  ];

  const [currentProvider, setCurrentProvider] = useState("OpenAI");

  const [currentIntegration, setCurrentIntregration] = useState("node.js");

  const selectedProvider = PROVIDERS.find(
    (provider) => provider.name === currentProvider
  );

  const currentCodeBlock = selectedProvider?.integrations[currentIntegration];

  return (
    <div className={cn(ISLAND_WIDTH, "py-16 md:py-32 flex flex-col gap-8")}>
      <div className="flex flex-col lg:flex-row gap-y-8 justify-between items-center">
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl sm:text-5xl font-semibold text-black">
            Get integrated in <span className="text-brand">seconds</span>
          </h2>
          <p className="text-lg sm:text-xl text-landing-description">
            Use any model and monitor applications at any scale.{" "}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap">
            {PROVIDERS.map((provider) => (
              <div
                key={provider.name}
                className={cn(
                  "w-20 h-20 rounded-md p-3 hover:bg-[#EBF7FB] transition-colors ease-in-out duration-200 cursor-pointer",
                  selectedProvider?.name === provider.name ? "bg-[#EBF7FB]" : ""
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
                      setCurrentIntregration("node.js");
                    }
                  }
                }}
              >
                <div className="flex items-center justify-center bg-white border border-slate-200 rounded-md h-full ">
                  {provider.logo}
                </div>
              </div>
            ))}
          </div>
          <Link
            href="https://docs.helicone.ai/getting-started/quick-start"
            target="_blank"
            className="text-sm text-landing-secondary flex gap-1 items-center"
          >
            Other providers? See docs <ArrowUpRightIcon className="h-3 w-3" />
          </Link>
        </div>
      </div>
      <div className="border rounded-2xl hidden md:flex flex-col divide-y divide-gray-700 mt-4">
        <div className="flex items-center justify-between py-2 px-8 bg-gray-900 rounded-t-2xl">
          <ul className="flex items-center space-x-0">
            {Object.keys(selectedProvider?.integrations || {}).map(
              (integration) => (
                <li
                  key={integration}
                  className={`text-gray-300 cursor-pointer text-sm px-4 py-2 ${
                    currentIntegration === integration
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
  );
};

export default Integrations;
