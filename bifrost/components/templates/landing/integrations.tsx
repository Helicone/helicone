"use client";

import { ISLAND_WIDTH } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { createHighlighter } from "shiki";

// Create a singleton highlighter instance
const highlighterPromise = createHighlighter({
  themes: ["github-light", "github-dark"],
  langs: ["javascript", "python", "bash"],
});

interface IntegrationsProps {}

const Integrations = (props: IntegrationsProps) => {
  const {} = props;

  const CODE_SNIPPETS = {
    gpt4: {
      formattedName: "OpenAI",
      logo: "/static/openai.webp",
      typescript: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://ai-gateway.helicone.ai",
  apiKey: process.env.HELICONE_API_KEY
});

const response = await client.chat.completions.create({
  model: "gpt-4o-mini",  // or any other 100+ models!
  messages: [{ role: "user", content: "Hello!" }]
});`,
      python: `from openai import OpenAI

client = OpenAI(
  base_url="https://ai-gateway.helicone.ai",
  api_key=os.environ["HELICONE_API_KEY"]
)

response = client.chat.completions.create(
  model="gpt-4o-mini",  # Or 100+ other models!
  messages=[{"role": "user", "content": "Hello!"}]
)`,
      curl: `curl "https://ai-gateway.helicone.ai/v1/chat/completions" \\
  -H "Authorization: Bearer $HELICONE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
      docsLink: "https://docs.helicone.ai/gateway/overview",
    },
    claude: {
      formattedName: "Anthropic",
      logo: "/static/anthropic.webp",
      typescript: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://ai-gateway.helicone.ai",
  apiKey: process.env.HELICONE_API_KEY
});

const response = await client.chat.completions.create({
  model: "claude-sonnet-4",  // or any other 100+ models!
  messages: [{ role: "user", content: "Hello!" }]
});`,
      python: `from openai import OpenAI

client = OpenAI(
  base_url="https://ai-gateway.helicone.ai",
  api_key=os.environ["HELICONE_API_KEY"]
)

response = client.chat.completions.create(
  model="claude-sonnet-4",  # Or 100+ other models!
  messages=[{"role": "user", "content": "Hello!"}]
)`,
      curl: `curl "https://ai-gateway.helicone.ai/v1/chat/completions" \\
  -H "Authorization: Bearer $HELICONE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
      docsLink: "https://docs.helicone.ai/gateway/overview",
    },
    gemini: {
      formattedName: "Gemini",
      logo: "/static/gemini.webp",
      typescript: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://ai-gateway.helicone.ai",
  apiKey: process.env.HELICONE_API_KEY
});

const response = await client.chat.completions.create({
  model: "gemini-2.0-flash-exp",  // or any other 100+ models!
  messages: [{ role: "user", content: "Hello!" }]
});`,
      python: `from openai import OpenAI

client = OpenAI(
  base_url="https://ai-gateway.helicone.ai",
  api_key=os.environ["HELICONE_API_KEY"]
)

response = client.chat.completions.create(
  model="gemini-2.0-flash-exp",  # Or 100+ other models!
  messages=[{"role": "user", "content": "Hello!"}]
)`,
      curl: `curl "https://ai-gateway.helicone.ai/v1/chat/completions" \\
  -H "Authorization: Bearer $HELICONE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gemini-2.0-flash-exp",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
      docsLink: "https://docs.helicone.ai/gateway/overview",
    },
    llama: {
      formattedName: "DeepSeek",
      logo: "/static/home/logos/deepseek.webp",
      typescript: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://ai-gateway.helicone.ai",
  apiKey: process.env.HELICONE_API_KEY
});

const response = await client.chat.completions.create({
  model: "deepseek-v3.2",  // or 100+ other models!
  messages: [{ role: "user", content: "Hello!" }]
});`,
      python: `from openai import OpenAI

client = OpenAI(
  base_url="https://ai-gateway.helicone.ai",
  api_key=os.environ["HELICONE_API_KEY"]
)

response = client.chat.completions.create(
  model="llama-3.3-70b",  # Or 100+ other models!
  messages=[{"role": "user", "content": "Hello!"}]
)`,
      curl: `curl "https://ai-gateway.helicone.ai/v1/chat/completions" \\
  -H "Authorization: Bearer $HELICONE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "llama-3.3-70b",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
      docsLink: "https://docs.helicone.ai/gateway/overview",
    },
  };

  const [currentProvider, setCurrentProvider] =
    useState<keyof typeof CODE_SNIPPETS>("gpt4");
  const [currentLanguage, setCurrentLanguage] = useState<
    "typescript" | "python" | "curl"
  >("typescript");
  const [highlightedCode, setHighlightedCode] = useState<string>("");

  const languages: Array<"typescript" | "python" | "curl"> = [
    "typescript",
    "python",
    "curl",
  ];

  const selectedProvider = CODE_SNIPPETS[currentProvider];
  const currentCode = selectedProvider[currentLanguage];

  useEffect(() => {
    const updateHighlightedCode = async () => {
      const highlighter = await highlighterPromise;
      const code = currentCode || "";

      const html = highlighter.codeToHtml(code, {
        lang:
          currentLanguage === "typescript"
            ? "javascript"
            : currentLanguage === "curl"
              ? "bash"
              : "python",
        theme: "github-dark",
      });
      setHighlightedCode(html);
    };

    updateHighlightedCode();
  }, [currentProvider, currentLanguage, currentCode]);

  const getLanguageDisplayName = (lang: string) => {
    switch (lang) {
      case "typescript":
        return "TypeScript";
      case "python":
        return "Python";
      case "curl":
        return "cURL";
      default:
        return lang;
    }
  };

  return (
    <div
      className={cn(
        ISLAND_WIDTH,
        " bg-white sm:bg-gradient-to-b sm:from-white sm:to-[#F2F9FC] sm:pb-40bg-[#f2f9fc] py-16 md:py-32 flex flex-col gap-10"
      )}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-y-8 justify-between items-center">
          <div className="flex flex-col gap-5">
            <h2 className="text-3xl sm:text-5xl font-semibold text-accent-foreground">
              One key, <span className="text-brand">100+ models</span>
            </h2>
            <p className="text-lg font-normal sm:text-xl text-muted-foreground">
              Switch providers by changing just the model name in your OpenAI
              SDK request - automatic failover and observability by default.
            </p>
            <div className="flex flex-col items-start gap-4">
              {/* Main providers with code examples */}
              <div className="flex flex-wrap gap-3">
                {Object.entries(CODE_SNIPPETS).map(([key, provider]) => (
                  <button
                    key={key}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200",
                      currentProvider === key
                        ? "bg-brand/10 border-brand text-brand"
                        : "bg-background border-border hover:border-brand/50 hover:bg-brand/5"
                    )}
                    onClick={() =>
                      setCurrentProvider(key as keyof typeof CODE_SNIPPETS)
                    }
                  >
                    <Image
                      src={provider.logo}
                      alt={provider.formattedName}
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain"
                    />
                    <span className="text-sm font-medium">
                      {provider.formattedName}
                    </span>
                  </button>
                ))}
              </div>

              {/* All models link */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Plus 100+ more models from providers like: Mistral, Groq,
                  Together AI, Azure, and more..
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Code block */}
        <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
          <div className="flex gap-2 md:gap-4 p-2 md:p-3 bg-[#24292e] border-b border-[hsl(var(--border))]">
            {languages.map((language) => (
              <button
                key={language}
                onClick={() => setCurrentLanguage(language)}
                className={`text-xs md:text-sm font-medium relative px-1 ${
                  currentLanguage === language
                    ? "text-white after:absolute after:bottom-[-8px] md:after:bottom-[-12px] after:left-0 after:w-full after:h-[2px] after:bg-white"
                    : "text-[hsl(var(--muted-foreground))] hover:text-white"
                }`}
              >
                {getLanguageDisplayName(language)}
              </button>
            ))}
            <div className="ml-auto">
              <button className="text-gray-300">
                <ClipboardIcon
                  onClick={() => {
                    navigator.clipboard.writeText(currentCode || "");
                    toast.success("Copied to clipboard");
                  }}
                  className="h-4 w-4 md:h-6 md:w-6"
                />
              </button>
            </div>
          </div>
          <div
            className="p-2 md:p-4 bg-[#24292e] overflow-x-auto text-xs md:text-sm"
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </div>
        <Toaster />
      </div>

      <div className="flex flex-col sm:flex-row gap-2 items-start md:gap-4">
        <div className="flex flex-col gap-2">
          <Link href="/signup">
            <Button className="bg-brand px-8 py-4 text-base md:text-lg md:py-3 lg:py-6 lg:px-10 lg:text-xl gap-2 rounded-lg items-center">
              Try for free
              <ChevronRight className="size-5 md:size-6" />
            </Button>
          </Link>
          <p className="text-sm text-landing-secondary">
            No credit card required
          </p>
        </div>
        <Link href="https://helicone.ai/models" target="_blank" rel="noopener">
          <Button variant="ghost" size="landing_page">
            View all models supported
            <ArrowUpRight className="size-4 md:size-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Integrations;
