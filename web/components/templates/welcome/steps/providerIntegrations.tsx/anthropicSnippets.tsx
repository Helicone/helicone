import { useState } from "react";
import { DiffHighlight } from "../../diffHighlight";
import { Tab, TabGroup, TabList } from "@tremor/react";
import { clsx } from "../../../../shared/clsx";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const CODE_CONVERTS = {
  typescript: (key: string) => `
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  baseURL: "https://anthropic.hconeai.com/",
  apiKey: 'my_api_key', // defaults to process.env["ANTHROPIC_API_KEY"]
  defaultHeaders: {
    "Helicone-Auth": "Bearer ${key}",
  },
});
  
const msg = await anthropic.messages.create({
  model: "claude-3-opus-20240229",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello, Claude" }],
});

console.log(msg);
`,

  python: (key: string) => `
import anthropic

client = anthropic.Anthropic(
  # defaults to os.environ.get("ANTHROPIC_API_KEY")
  api_key="my_api_key",
  base_url="https://anthropic.hconeai.com/",
  default_headers={
    "Helicone-Auth": "Bearer ${key}",
  }
)
  
message = client.messages.create(
  model="claude-3-opus-20240229",
  max_tokens=1024,
  messages=[
    {"role": "user", "content": "Hello, Claude"}
  ]
)
  
print(message.content)
`,

  langchain_python: (key: string) => `
anthropic = ChatAnthropic(
  temperature=0.9,
  model="claude-3-opus-20240229",
  anthropic_api_url="https://anthropic.hconeai.com/",
  anthropic_api_key="ANTHROPIC_API_KEY",
  model_kwargs={
    "extra_headers":{
      "Helicone-Auth": f"Bearer ${key}"
    }
  }
)
  

`,
  langchain_typescript: (key: string) => `
const llm = new ChatAnthropic({
  modelName: "claude-3-opus-20240229",
  anthropicApiKey: "ANTHROPIC_API_KEY",
  clientOptions: {
    baseURL: "https://anthropic.hconeai.com/",
    defaultHeaders: {
      "Helicone-Auth": "Bearer ${key}",
    }
  }
});
`,
};

type SupportedLanguages = keyof typeof CODE_CONVERTS;

const DIFF_LINES: {
  [key in SupportedLanguages]: number[];
} = {
  typescript: [3, 6],
  python: [5, 7],
  langchain_python: [3, 7],
  langchain_typescript: [4, 6],
};

const NAMES: {
  [key in SupportedLanguages]: string;
} = {
  typescript: "Node.js",
  python: "Python",
  langchain_python: "LangChain",
  langchain_typescript: "LangChainJS",
};

interface AnthropicSnippetsProps {
  apiKey?: string;
}

export default function AnthropicSnippets(props: AnthropicSnippetsProps) {
  const { apiKey = "<YOUR_API_KEY>" } = props;
  const [lang, setLang] = useState<SupportedLanguages>("typescript");

  return (
    <div className="w-full flex flex-col">
      <label className="font-semibold text-sm">
        Select your integration method
      </label>
      <div className="flex flex-wrap gap-4 py-2 w-full">
        <button
          className={clsx(
            lang === "typescript" ? "bg-sky-100" : "bg-white",
            "flex items-center gap-2 border border-gray-300 rounded-lg py-2 px-4"
          )}
          onClick={() => setLang("typescript")}
        >
          <h2 className="font-semibold">Node.js</h2>
        </button>
        <button
          className={clsx(
            lang === "python" ? "bg-sky-100" : "bg-white",
            "flex items-center gap-2 border border-gray-300 rounded-lg py-2 px-4"
          )}
          onClick={() => setLang("python")}
        >
          <h2 className="font-semibold">Python</h2>
        </button>
        <button
          className={clsx(
            lang === "langchain_python" ? "bg-sky-100" : "bg-white",
            "flex items-center gap-2 border border-gray-300 rounded-lg py-2 px-4"
          )}
          onClick={() => setLang("langchain_python")}
        >
          <h2 className="font-semibold">Langchain</h2>
        </button>
        <button
          className={clsx(
            lang === "langchain_typescript" ? "bg-sky-100" : "bg-white",
            "flex items-center gap-2 border border-gray-300 rounded-lg py-2 px-4"
          )}
          onClick={() => setLang("langchain_typescript")}
        >
          <h2 className="font-semibold">LangchainJS</h2>
        </button>
      </div>

      <DiffHighlight
        code={CODE_CONVERTS[lang](apiKey)}
        language="bash"
        newLines={DIFF_LINES[lang]}
        oldLines={[]}
        minHeight={false}
      />
    </div>
  );
}
