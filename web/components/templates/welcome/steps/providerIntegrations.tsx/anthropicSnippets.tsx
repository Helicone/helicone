import { useState } from "react";
import { DiffHighlight } from "../../diffHighlight";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

      <div className="mt-2">
        <div className="flex overflow-x-auto py-2 w-full no-scrollbar">
          <div className="flex gap-2">
            <Button
              variant={"outline"}
              size="sm"
              className={
                lang === "typescript"
                  ? "bg-slate-200 border-slate-200 dark:bg-slate-800 dark:border-slate-800"
                  : ""
              }
              onClick={() => setLang("typescript")}
            >
              Node.js
            </Button>
            <Button
              variant={"outline"}
              size="sm"
              className={
                lang === "python"
                  ? "bg-slate-200 border-slate-200 dark:bg-slate-800 dark:border-slate-800"
                  : ""
              }
              onClick={() => setLang("python")}
            >
              Python
            </Button>
            <Button
              variant={"outline"}
              size="sm"
              className={
                lang === "curl"
                  ? "bg-slate-200 border-slate-200 dark:bg-slate-800 dark:border-slate-800"
                  : ""
              }
              onClick={() => setLang("curl")}
            >
              cURL
            </Button>
            <Link
              href="https://docs.helicone.ai/integrations/anthropic/javascript"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant={"outline"} size="sm">
                <h2 className="font-semibold">More ›</h2>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
