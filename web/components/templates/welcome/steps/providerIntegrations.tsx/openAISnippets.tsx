import { useState } from "react";
import { DiffHighlight } from "../../diffHighlight";
import { clsx } from "../../../../shared/clsx";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const CODE_CONVERTS = {
  curl: (key: string) => `curl "${BASE_PATH}/chat/completions" \\
  -H "Authorization: Bearer {{OPENAI_API_KEY}}" \\
  -H "Helicone-Auth: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }'`,
  typescript: (key: string) => `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "{{OPENAI_API_KEY}}",
  baseURL: "${BASE_PATH}",
  defaultHeaders: {
    "Helicone-Auth": "Bearer ${key}"
  }
});`,

  python: (key: string) => `from openai import OpenAI

client = OpenAI(
  api_key="{{OPENAI_API_KEY}}",
  base_url="${BASE_PATH}",
  default_headers={
    "Helicone-Auth": f"Bearer ${key}"
  }
)`,

  langchain_python: (key: string) => `
openai.api_base = "${BASE_PATH}"

llm = ChatOpenAI(
  openai_api_key='<YOUR_API_KEY>',
  headers={
    "Helicone-Auth": f"Bearer ${key}"
  },
)
  
`,
  langchain_typescript: (key: string) => `
import OpenAI from "openai";

const llm = new OpenAI({
  modelName: "gpt-3.5-turbo",
  configuration: {
    baseUrl: "${BASE_PATH}",
    defaultHeaders: {
      "Helicone-Auth": "Bearer ${key}",
    },
  },
});
`,
  asyncLogging: (key: string) => `
import { HeliconeAsyncLogger } from "@helicone/helicone";
import OpenAI from "openai";

const logger = new HeliconeAsyncLogger({
  apiKey: process.env.HELICONE_API_KEY,
  providers: {
    openAI: OpenAI
  }
});
logger.init();

const openai = new OpenAI();

// Call OpenAI
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
// Call OpenAI using JS SDK / fetch
const res = await r.json();
console.log(res);

logger.sendLog(res);
  `,
};

type SupportedLanguages = keyof typeof CODE_CONVERTS;

const DIFF_LINES: {
  [key in SupportedLanguages]: number[];
} = {
  typescript: [4, 6],
  python: [4, 6],
  curl: [0, 2],
  langchain_python: [0, 5],
  langchain_typescript: [5, 7],
  asyncLogging: [],
  manualLogging: [],
};

const NAMES: {
  [key in SupportedLanguages]: string;
} = {
  curl: "cURL",
  typescript: "Node.js",
  python: "Python",
  langchain_python: "LangChain",
  langchain_typescript: "LangChainJS",
  asyncLogging: "OpenLLMetry",
  manualLogging: "Custom",
};

interface OpenAISnippetsProps {
  apiKey?: string;
}

export default function OpenAISnippets(props: OpenAISnippetsProps) {
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
              href="https://docs.helicone.ai/integrations/openai/javascript"
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
