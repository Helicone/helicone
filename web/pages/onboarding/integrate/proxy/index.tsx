"use client";

import { useEffect, useState } from "react";
import { createHighlighter } from "shiki";
import { Button } from "@/components/ui/button";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { useOrgOnboardingStore } from "@/store/onboardingStore";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { env } from "next-runtime-env";
import { generateAPIKeyHelper } from "@/utils/generateAPIKeyHelper";
import { useUser } from "@supabase/auth-helpers-react";
import { useOrg } from "@/components/layout/org/organizationContext";
import useNotification from "@/components/shared/notification/useNotification";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  BookOpen,
  MessageSquare,
  Mail,
  Loader2,
  ClipboardCopy,
  Check,
  Copy,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Result } from "@/lib/result";
import { useRouter } from "next/navigation";

const BASE_PATH = env("NEXT_PUBLIC_BASE_PATH");

const CODE_SNIPPETS = {
  openai: {
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
    curl: (key: string) => `curl "${BASE_PATH}/chat/completions" \\
  -H "Authorization: Bearer {{OPENAI_API_KEY}}" \\
  -H "Helicone-Auth: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
    docsLink: "https://docs.helicone.ai/getting-started/integration/openai",
  },
  azure: {
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
    curl: (
      key: string
    ) => `curl "https://oai.helicone.ai/openai/deployments/{{YOUR_DEPLOYMENT}}/chat/completions?api-version={{API_VERSION}}" \\
  -H "api-key: {{AZURE_API_KEY}}" \\
  -H "Helicone-Auth: Bearer ${key}" \\
  -H "Helicone-OpenAI-Api-Base: https://{{RESOURCE_NAME}}.openai.azure.com" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
    docsLink: "https://docs.helicone.ai/getting-started/integration/azure",
  },
  anthropic: {
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
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
    docsLink: "https://docs.helicone.ai/getting-started/integration/anthropic",
  },
};

type Provider = keyof typeof CODE_SNIPPETS;
type Language = "typescript" | "python" | "curl";

// Create a singleton highlighter instance
const highlighterPromise = createHighlighter({
  themes: ["github-light", "github-dark"],
  langs: ["javascript", "python", "bash"],
});

export default function ProxyPage() {
  const { setCurrentStep } = useOrgOnboardingStore();
  const user = useUser();
  const { setNotification } = useNotification();
  const org = useOrg();
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>("openai");
  const [language, setLanguage] = useState<Language>("typescript");
  const [highlightedCode, setHighlightedCode] = useState("");
  const [apiKey, setApiKey] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Add the event listening query
  const { data: hasEvent } = useQuery<Result<boolean, string>, Error>(
    ["hasOnboarded"],
    async () => {
      const response = await fetch("/api/user/checkOnboarded", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const jsonData = await response.json();
      if (!response.ok) {
        return null;
      }
      return jsonData;
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: 3000,
      enabled: true,
    }
  );

  useEffect(() => {
    setCurrentStep("EVENT");
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
  }, [user, org?.currentOrg?.organization_type, apiKey, setNotification]);

  useEffect(() => {
    const updateHighlightedCode = async () => {
      const highlighter = await highlighterPromise;
      const code = CODE_SNIPPETS[provider][language](
        apiKey || "<YOUR_API_KEY>"
      );

      const html = highlighter.codeToHtml(code, {
        lang:
          language === "typescript"
            ? "javascript"
            : language === "curl"
            ? "bash"
            : "python",
        theme: "github-dark",
      });
      setHighlightedCode(html);
    };

    updateHighlightedCode();
  }, [provider, language, apiKey]);

  // Effect to handle auto-redirect when event is received
  useEffect(() => {
    if (hasEvent?.data) {
      // Wait 1.5 seconds to show the success state before redirecting
      const timeout = setTimeout(() => {
        router.push("/dashboard");
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [hasEvent?.data, router]);

  return (
    <div className="min-h-screen bg-background">
      <OnboardingHeader />
      <div className="flex flex-col gap-6 mx-auto max-w-4xl mt-12">
        <main className="w-full">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold">
                Send an event via Proxy
              </h1>
              <p className="text-sm text-slate-500">
                Select your preferred provider and language.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Tabs
                  value={provider}
                  onValueChange={(value) => setProvider(value as Provider)}
                >
                  <TabsList>
                    {Object.entries(CODE_SNIPPETS).map(([key, langs]) => (
                      <TabsTrigger key={key} value={key}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <Link
                  href={CODE_SNIPPETS[provider].docsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="link"
                    className="flex items-center gap-2 text-sky-500"
                  >
                    Other providers
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="flex gap-4 p-3 bg-[#24292e] border-b">
                  {(["typescript", "python", "curl"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`text-sm font-medium relative px-1 ${
                        language === lang
                          ? "text-white after:absolute after:bottom-[-12px] after:left-0 after:w-full after:h-[2px] after:bg-white"
                          : "text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      {lang === "typescript"
                        ? "node.js"
                        : lang === "curl"
                        ? "curl"
                        : "python"}
                    </button>
                  ))}
                </div>
                <div className="relative group">
                  <div
                    className="p-4 bg-[#24292e] overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                    {copied && (
                      <span className="text-sm text-gray-300 bg-gray-700 px-2 h-8 flex items-center rounded">
                        Copied!
                      </span>
                    )}
                    <button
                      onClick={() => {
                        const code = CODE_SNIPPETS[provider][language](
                          apiKey || "<YOUR_API_KEY>"
                        );
                        navigator.clipboard.writeText(code);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded p-2"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="link" className="w-fit">
                    Need some help? <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link
                      href="https://docs.helicone.ai"
                      target="_blank"
                      className="flex items-center"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Documentation
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="https://discord.com/invite/2TkeWdXNPQ"
                      target="_blank"
                      className="flex items-center"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Ask us on Discord
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/contact"
                      className="flex items-center"
                      target="_blank"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Contact Us
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center justify-between gap-4">
                <Link href="/dashboard">
                  <Button variant="secondary">Do it Later</Button>
                </Link>
                <Button
                  variant="action"
                  className="flex items-center gap-2 w-fit"
                  disabled={true}
                >
                  {hasEvent?.data ? (
                    <>
                      <Check className="h-4 w-4" />
                      Event received!
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Listening
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
      <style jsx global>{`
        .bg-yellow-500\/10 {
          background-color: rgba(234, 179, 8, 0.1);
        }
      `}</style>
    </div>
  );
}
