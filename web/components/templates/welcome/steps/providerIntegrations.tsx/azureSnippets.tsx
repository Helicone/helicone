import { useState } from "react";
import { DiffHighlight } from "../../diffHighlight";
import { clsx } from "../../../../shared/clsx";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const CODE_CONVERTS = {
  typescript: (key: string) => `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "{{AZURE_API_KEY}}",
  baseURL: "https://oai.helicone.ai/openai/deployments/{{YOUR_DEPLOYMENT}}",
  defaultHeaders: {
    "Helicone-Auth": "Bearer ${key}",
    "Helicone-OpenAI-Api-Base": "https://{{RESOURCE_NAME}}.openai.azure.com"
  },
  defaultQuery: { "api-version": "{{API_VERSION}}" }
});`,

  python: (key: string) => `from openai import OpenAI

client = OpenAI(
  api_key="{{AZURE_API_KEY}}",
  base_url="https://oai.helicone.ai/openai/deployments/{{YOUR_DEPLOYMENT}}",
  default_headers={
    "Helicone-Auth": f"Bearer ${key}",
    "Helicone-OpenAI-Api-Base": "https://{{RESOURCE_NAME}}.openai.azure.com"
  },
  default_query={ "api-version": "{{API_VERSION}}" }
)`,

  langchain_python: (key: string) => `
from langchain.chat_models import AzureChatOpenAI
  
helicone_headers = {
  "Helicone-Auth": f"Bearer {helicone_api_key}",
  "Helicone-OpenAI-Api-Base": "https://<model_name>.openai.azure.com/"
}

self.model = AzureChatOpenAI(
  openai_api_base="https://oai.helicone.ai",
  deployment_name="gpt-35-turbo",
  openai_api_key=<AZURE_OPENAI_API_KEY>,
  openai_api_version="2023-05-15",
  openai_api_type="azure",
  max_retries=max_retries,
  headers=helicone_headers,
  **kwargs,
)

`,
  langchain_typescript: (key: string) => `
const model = new ChatOpenAI({
  azureOpenAIApiKey: "[AZURE_OPENAI_API_KEY]",
  azureOpenAIApiDeploymentName: "openai/deployments/gpt-35-turbo",
  azureOpenAIApiVersion: "2023-03-15-preview",
  azureOpenAIBasePath: "https://oai.helicone.ai",
  configuration: {
    organization: "[organization]",
    baseOptions: {
      headers: {
        "Helicone-Auth": "Bearer ${key}",
        "Helicone-OpenAI-Api-Base": "https://[YOUR_AZURE_DOMAIN].openai.azure.com",
      },
    },
  },
});
`,
  asyncLogging: (key: string) => `
import { HeliconeAsyncLogger } from "@helicone/helicone";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

const logger = new HeliconeAsyncLogger({
  apiKey: process.env.HELICONE_API_KEY,
  providers: {
    azureOpenAI: OpenAIClient
  }
});
logger.init();

const client = new OpenAIClient(
  \`https://\${process.env.AZURE_RESOURCE_NAME}.openai.azure.com/\`,
  new AzureKeyCredential(process.env.AZURE_API_KEY!),
);

// Call OpenAI using Azure SDK
  `,
  manualLogging: (key: string) => `
import { HeliconeManualLogger } from "@helicone/helicone";

const logger = new HeliconeManualLogger({
  apiKey: process.env.HELICONE_API_KEY
});

const reqBody = {
  "model": "text-embedding-ada-002",
  "input": "The food was delicious and the waiter was very friendly.",
  "encoding_format": "float"
}

logger.registerRequest(reqBody);
// Call OpenAI using Azure SDK and send the logs to Helicone
console.log(res);
logger.sendLog(res);
  `,
  curl: (
    key: string
  ) => `curl "https://oai.helicone.ai/openai/deployments/{{YOUR_DEPLOYMENT}}/chat/completions?api-version={{API_VERSION}}" \\
  -H "api-key: {{AZURE_API_KEY}}" \\
  -H "Helicone-Auth: Bearer ${key}" \\
  -H "Helicone-OpenAI-Api-Base: https://{{RESOURCE_NAME}}.openai.azure.com" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }'`,
};

type SupportedLanguages = keyof typeof CODE_CONVERTS;

const DIFF_LINES: {
  [key in SupportedLanguages]: number[];
} = {
  typescript: [4, 6, 7],
  python: [4, 6, 7],
  langchain_python: [3, 4, 14],
  langchain_typescript: [4, 9, 10],
  asyncLogging: [],
  manualLogging: [],
  curl: [0, 2, 3],
};

const NAMES: {
  [key in SupportedLanguages]: string;
} = {
  typescript: "Node.js",
  python: "Python",
  langchain_python: "LangChain",
  langchain_typescript: "LangChainJS",
  asyncLogging: "OpenLLMetry",
  manualLogging: "Custom",
  curl: "cURL",
};

interface AzureSnippetsProps {
  apiKey?: string;
}

export default function AzureSnippets(props: AzureSnippetsProps) {
  const { apiKey = "<YOUR_API_KEY>" } = props;
  const [lang, setLang] = useState<SupportedLanguages>("typescript");

  return (
    <div className="w-full flex flex-col">
      <DiffHighlight
        code={CODE_CONVERTS[lang](apiKey)}
        language={lang}
        newLines={DIFF_LINES[lang]}
        oldLines={[]}
        minHeight={false}
      />

      <div className="mt-8">
        <div className="flex overflow-x-auto py-2 w-full no-scrollbar">
          <div className="flex gap-2">
            <button
              className={clsx(
                lang === "typescript" ? "bg-sky-100" : "bg-white",
                "flex-shrink-0 flex items-center gap-2 border border-gray-300 rounded-lg py-1.5 px-3 text-sm"
              )}
              onClick={() => setLang("typescript")}
            >
              <h2 className="font-semibold">Node.js</h2>
            </button>
            <button
              className={clsx(
                lang === "python" ? "bg-sky-100" : "bg-white",
                "flex-shrink-0 flex items-center gap-2 border border-gray-300 rounded-lg py-1.5 px-3 text-sm"
              )}
              onClick={() => setLang("python")}
            >
              <h2 className="font-semibold">Python</h2>
            </button>
            <button
              className={clsx(
                lang === "curl" ? "bg-sky-100" : "bg-white",
                "flex-shrink-0 flex items-center gap-2 border border-gray-300 rounded-lg py-1.5 px-3 text-sm"
              )}
              onClick={() => setLang("curl")}
            >
              <h2 className="font-semibold">cURL</h2>
            </button>
            <a
              href="https://docs.helicone.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-2 border border-gray-300 rounded-lg py-1.5 px-3 text-sm hover:bg-gray-50"
            >
              <h2 className="font-semibold">More ›</h2>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
