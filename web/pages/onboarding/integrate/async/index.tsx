"use client";

import { useEffect, useState } from "react";
import { createHighlighter } from "shiki";
import { Button } from "@/components/ui/button";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
import { useOrgOnboardingStore } from "@/store/onboardingStore";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
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

const CODE_SNIPPETS = {
  openai: {
    typescript: (
      key: string
    ) => `import { HeliconeAsyncLogger } from "@helicone/helicone";
import OpenAI from "openai";

const logger = new HeliconeAsyncLogger({
  apiKey: process.env.HELICONE_API_KEY,
  providers: {
    openAI: OpenAI
  }
});
logger.init();

const openai = new OpenAI();`,
    docsLink: "https://docs.helicone.ai/getting-started/integration/openai",
  },
  azure: {
    typescript: (
      key: string
    ) => `import { HeliconeAsyncLogger } from "@helicone/helicone";
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
);`,
    docsLink: "https://docs.helicone.ai/getting-started/integration/azure",
  },
  anthropic: {
    typescript: (
      key: string
    ) => `import { HeliconeAsyncLogger } from "@helicone/helicone";
import Anthropic from "@anthropic-ai/sdk";

const logger = new HeliconeAsyncLogger({
  apiKey: process.env.HELICONE_API_KEY,
  providers: {
    anthropic: Anthropic
  }
});
logger.init();

const anthropic = new Anthropic();`,
    docsLink: "https://docs.helicone.ai/getting-started/integration/anthropic",
  },
};

type Provider = keyof typeof CODE_SNIPPETS;

// Create a singleton highlighter instance
const highlighterPromise = createHighlighter({
  themes: ["github-light", "github-dark"],
  langs: ["javascript", "python", "bash"],
});

export default function AsyncPage() {
  const { setCurrentStep } = useOrgOnboardingStore();
  const user = useUser();
  const { setNotification } = useNotification();
  const org = useOrg();
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>("openai");
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
      const code = CODE_SNIPPETS[provider].typescript(
        apiKey || "<YOUR_API_KEY>"
      );

      const html = highlighter.codeToHtml(code, {
        lang: "javascript",
        theme: "github-dark",
      });
      setHighlightedCode(html);
    };

    updateHighlightedCode();
  }, [provider, apiKey]);

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
                Send an event via OpenLLMetry
              </h1>
              <p className="text-sm text-slate-500">
                Select your preferred provider to get started with async
                logging.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Tabs
                  value={provider}
                  onValueChange={(value) => setProvider(value as Provider)}
                >
                  <TabsList>
                    {Object.entries(CODE_SNIPPETS).map(([key, _]) => (
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
                        const code = CODE_SNIPPETS[provider].typescript(
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
    </div>
  );
}
