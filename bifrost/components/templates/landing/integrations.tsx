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
    openai: {
      formattedName: "OpenAI",
      logo: "/static/openai.webp",
      typescript: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: \`https://oai.helicone.ai/v1/\${HELICONE_API_KEY}\`
});`,
      python: `from openai import OpenAI

client = OpenAI(
  api_key=OPENAI_API_KEY,
  base_url=f"https://oai.helicone.ai/v1/{HELICONE_API_KEY}"
)`,
      curl: `curl "https://oai.helicone.ai/v1/$HELICONE_API_KEY/chat/completions" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
      docsLink: "https://docs.helicone.ai/getting-started/integration/openai",
    },
    anthropic: {
      formattedName: "Anthropic",
      logo: "/static/anthropic.webp",
      typescript: `import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
  baseURL: \`https://anthropic.helicone.ai/\${HELICONE_API_KEY}\`,
});`,
      python: `from anthropic import Anthropic

client = Anthropic(
  api_key=ANTHROPIC_API_KEY,
  base_url=f"https://anthropic.helicone.ai/{HELICONE_API_KEY}",
)`,
      curl: `curl "https://anthropic.helicone.ai/$HELICONE_API_KEY/v1/messages" \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 1024
  }'`,
      docsLink:
        "https://docs.helicone.ai/getting-started/integration/anthropic",
    },
    google: {
      formattedName: "Google Gemini",
      logo: "/static/gemini.webp",
      typescript: `import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: GOOGLE_API_KEY,
  httpOptions: {
    baseUrl: "https://gateway.helicone.ai",
    headers: {
      "Helicone-Auth": \`Bearer \${HELICONE_API_KEY}\`,
      "Helicone-Target-URL": "https://generativelanguage.googleapis.com"
    }
  }
});`,
      python: `from google import genai

client = genai.Client(
  api_key=GOOGLE_API_KEY,
  http_options={
    "base_url": "https://gateway.helicone.ai",
    "headers": {
      "helicone-auth": f"Bearer {HELICONE_API_KEY}",
      "helicone-target-url": "https://generativelanguage.googleapis.com"
    }
  }
)`,
      curl: `curl "https://gateway.helicone.ai/v1beta/models/gemini-2.0-flash:generateContent?key=$GOOGLE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Helicone-Auth: Bearer $HELICONE_API_KEY" \\
  -H "Helicone-Target-URL: https://generativelanguage.googleapis.com" \\
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hello!"
      }]
    }]
  }'`,
      docsLink: "https://docs.helicone.ai/integrations/gemini/api/curl",
    },
    openrouter: {
      formattedName: "OpenRouter",
      logo: "/static/openrouter.webp",
      typescript: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: "https://openrouter.helicone.ai/api/v1",
  defaultHeaders: {
    "Helicone-Auth": \`Bearer \${HELICONE_API_KEY}\`
  }
});`,
      python: `from openai import OpenAI

client = OpenAI(
  api_key=OPENROUTER_API_KEY,
  base_url="https://openrouter.helicone.ai/api/v1",
  default_headers={
    "Helicone-Auth": f"Bearer {HELICONE_API_KEY}"
  }
)`,
      curl: `curl "https://openrouter.helicone.ai/api/v1/chat/completions" \\
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \\
  -H "Helicone-Auth: Bearer $HELICONE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
      docsLink:
        "https://docs.helicone.ai/getting-started/integration-method/openrouter",
    },
    truefoundry: {
      formattedName: "TrueFoundry",
      logo: "/static/truefoundry.webp",
      typescript: `import OpenAI from "openai";
import { HeliconeAsyncLogger } from "helicone-async";

const logger = new HeliconeAsyncLogger({
  apiKey: HELICONE_API_KEY,
});
logger.init();

const client = new OpenAI({
  apiKey: TRUEFOUNDRY_JWT_TOKEN,
  baseURL: "your-truefoundry-base-url"
});`,
      python: `from openai import OpenAI
from helicone_async import HeliconeAsyncLogger

logger = HeliconeAsyncLogger(
    api_key=HELICONE_API_KEY,
)
logger.init()

client = OpenAI(
    api_key=TRUEFOUNDRY_JWT_TOKEN,
    base_url="your-truefoundry-base-url"
)`,
      curl: `# Install helicone-async first
pip install helicone-async openai

# Then use the Python integration above`,
      docsLink:
        "https://docs.helicone.ai/getting-started/integration-method/truefoundry",
    },
  };

  const ADDITIONAL_PROVIDERS = [
    {
      name: "Vercel AI SDK",
      logo: "/static/vercel.webp",
      href: "https://docs.helicone.ai/getting-started/integration-method/vercelai",
    },
    {
      name: "TogetherAI",
      logo: "/static/together.webp",
      href: "https://docs.helicone.ai/getting-started/integration-method/together",
    },
    {
      name: "AWS Bedrock",
      logo: "/static/aws-bedrock.webp",
      href: "https://docs.helicone.ai/integrations/bedrock/",
    },
    {
      name: "LangChain",
      logo: "/static/langchain.webp",
      href: "https://docs.helicone.ai/integrations/openai/langchain",
    },
    {
      name: "Groq",
      logo: "/static/groq.webp",
      href: "https://docs.helicone.ai/integrations/groq/",
    },
    {
      name: "LiteLLM",
      logo: "/static/litellm.webp",
      href: "https://docs.helicone.ai/getting-started/integration-method/litellm",
    },
    {
      name: "Azure OpenAI",
      logo: "/static/azure.webp",
      href: "https://docs.helicone.ai/getting-started/integration/azure",
    },
  ];

  const [currentProvider, setCurrentProvider] =
    useState<keyof typeof CODE_SNIPPETS>("openai");
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
    <div className={cn(ISLAND_WIDTH, "py-16 md:py-32 flex flex-col gap-10")}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-y-8 justify-between items-center">
          <div className="flex flex-col gap-5">
            <h2 className="text-3xl sm:text-5xl font-semibold text-accent-foreground">
              Get integrated in <span className="text-brand">seconds</span>
            </h2>
            <p className="text-lg font-normal sm:text-xl text-muted-foreground">
              Add logging, monitoring, and analytics to any LLM provider with a
              single line of code.
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

              {/* Additional providers */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Plus 50+ more:
                </span>
                {ADDITIONAL_PROVIDERS.map((provider) => (
                  <button
                    key={provider.name}
                    className="text-sm text-brand hover:text-brand/80 underline underline-offset-2 hover:no-underline transition-colors"
                    onClick={() => window.open(provider.href, "_blank")}
                  >
                    {provider.name}
                  </button>
                ))}
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
            No credit card required, 7-day free trial
          </p>
        </div>
        <Link
          href="https://docs.helicone.ai/getting-started/quick-start#quick-start"
          target="_blank"
          rel="noopener"
        >
          <Button variant="ghost" size="landing_page">
            View all providers
            <ArrowUpRight className="size-4 md:size-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Integrations;
