import { useEffect, useState } from "react";
import { createHighlighter } from "shiki";
import { Button } from "@/components/ui/button";
import { OnboardingHeader } from "@/components/onboarding/OnboardingHeader";
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
  Check,
  Copy,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Result } from "@/lib/result";
import { useRouter } from "next/navigation";
import { useOrgOnboarding } from "@/services/hooks/useOrgOnboarding";

// Create a singleton highlighter instance
const highlighterPromise = createHighlighter({
  themes: ["github-light", "github-dark"],
  langs: ["javascript", "python", "bash"],
});

type CodeGenerator = (key: string) => string;

interface ProviderConfig {
  docsLink: string;
  formattedName: string;
  [language: string]: CodeGenerator | string;
}

export type CodeSnippet = {
  [provider: string]: ProviderConfig;
};

type Provider = string;
type Language = string;

interface CodeIntegrationPageProps {
  title: string;
  description: string;
  codeSnippets: CodeSnippet;
  languages?: string[];
  defaultProvider?: string;
  defaultLanguage?: string;
}

export function CodeIntegrationPage({
  title,
  description,
  codeSnippets,
  languages = ["typescript"],
  defaultProvider = "openai",
  defaultLanguage = "typescript",
}: CodeIntegrationPageProps) {
  const user = useUser();
  const { setNotification } = useNotification();
  const org = useOrg();
  const router = useRouter();
  const { updateCurrentStep, completeOnboarding } = useOrgOnboarding(
    org?.currentOrg?.id ?? ""
  );
  const [provider, setProvider] = useState<Provider>(defaultProvider);
  const [language, setLanguage] = useState<Language>(defaultLanguage);
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
    updateCurrentStep("EVENT");
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
      const generator = codeSnippets[provider][language] as CodeGenerator;

      if (typeof generator !== "function") {
        setHighlightedCode(""); // Clear the code if no generator exists
        return;
      }

      const code = generator(apiKey || "<YOUR_API_KEY>");
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
  }, [provider, language, apiKey, codeSnippets]);

  useEffect(() => {
    if (hasEvent?.data) {
      const timeout = setTimeout(async () => {
        await completeOnboarding();
        router.push("/dashboard");
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [hasEvent?.data, router, completeOnboarding]);

  const availableLanguages = Object.keys(codeSnippets[provider]).filter(
    (key) => typeof codeSnippets[provider][key] === "function"
  );

  // If current language is not available for this provider, switch to first available
  useEffect(() => {
    if (
      !availableLanguages.includes(language) &&
      availableLanguages.length > 0
    ) {
      setLanguage(availableLanguages[0]);
    }
  }, [provider, availableLanguages, language]);

  return (
    <OnboardingHeader>
      <div className="flex flex-col gap-6 mx-auto max-w-4xl py-12">
        <main className="w-full">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold">{title}</h1>
              <p className="text-sm text-slate-500">{description}</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Tabs
                  value={provider}
                  onValueChange={(value) => setProvider(value)}
                >
                  <TabsList>
                    {Object.entries(codeSnippets).map(([key, config]) => (
                      <TabsTrigger key={key} value={key}>
                        {config.formattedName}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <Link
                  href={codeSnippets[provider].docsLink}
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
                {availableLanguages.length > 1 && (
                  <div className="flex gap-4 p-3 bg-[#24292e] border-b">
                    {availableLanguages.map((lang) => (
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
                )}
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
                        const generator = codeSnippets[provider][
                          language
                        ] as CodeGenerator;
                        const code = generator(apiKey || "<YOUR_API_KEY>");
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
                  <Button variant="link" className="w-fit group">
                    Need some help?
                    <ChevronDown className="ml-2 h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
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
    </OnboardingHeader>
  );
}
