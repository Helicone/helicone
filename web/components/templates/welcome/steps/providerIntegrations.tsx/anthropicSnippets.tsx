import { useState } from "react";
import { DiffHighlight } from "../../diffHighlight";
import { clsx } from "../../../../shared/clsx";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const CODE_CONVERTS = {
  typescript: (key: string) => `import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: "{{ANTHROPIC_API_KEY}}",
  baseURL: "https://anthropic.helicone.ai",
  defaultHeaders: {
    "Helicone-Auth": "Bearer ${key}"
  }
});`,

  python: (key: string) => `from anthropic import Anthropic

client = Anthropic(
  api_key="{{ANTHROPIC_API_KEY}}",
  base_url="https://anthropic.helicone.ai",
  default_headers={
    "Helicone-Auth": f"Bearer ${key}"
  }
)`,

  curl: (key: string) => `curl "https://anthropic.helicone.ai/v1/messages" \\
  -H "x-api-key: {{ANTHROPIC_API_KEY}}" \\
  -H "Helicone-Auth: Bearer ${key}" \\
  -H "anthropic-version: 2023-06-01" \\
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
  typescript: [4, 6],
  python: [4, 6],
  curl: [0, 2],
};

interface AnthropicSnippetsProps {
  apiKey?: string;
}

export default function AnthropicSnippets(props: AnthropicSnippetsProps) {
  const { apiKey = "<YOUR_API_KEY>" } = props;
  const [lang, setLang] = useState<SupportedLanguages>("typescript");

  return (
    <div className="w-full flex flex-col">
      <DiffHighlight
        code={CODE_CONVERTS[lang](apiKey)}
        language={lang === "curl" ? "bash" : lang}
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
