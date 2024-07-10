import { clsx } from "@/utils/clsx";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import React from "react";

interface Integration {
  title: string;
  href: string;
  imageHref: string;
  docsHref: string;
  altDocString?: React.ReactNode;
  imageClassName?: string;
}

const integrations: Integration[] = [
  {
    title: "PostHog",
    href: "https://posthog.com",
    imageHref: "/static/integrations/posthog.webp",
    docsHref: "https://posthog.com/docs/ai-engineering/helicone-posthog",
    imageClassName: "px-[12px]",
  },

  {
    title: "Big-AGI",
    href: "https://github.com/enricoros/big-agi?tab=readme-ov-file",
    imageHref: "/static/integrations/big_agi.png",
    docsHref: "https://github.com/enricoros/big-agi?tab=readme-ov-file",
    imageClassName: "px-[28px]",
  },
  {
    title: "LangChain",
    href: "https://www.langchain.com/",
    imageHref: "/static/integrations/langchain.jpeg",
    docsHref: "https://docs.helicone.ai/integrations/openai/langchain",
    imageClassName: "px-[12px]",
  },
  {
    title: "LLamaIndex",
    href: "https://www.llamaindex.ai/",
    imageHref: "/static/integrations/llamaindex.png",
    docsHref: "https://docs.helicone.ai/integrations/openai/llamaindex",
    imageClassName: "px-[8px]",
  },
  {
    title: "Crew AI",
    href: "https://www.crewai.com/",
    imageHref: "/static/integrations/crewai.png",
    docsHref: "https://docs.helicone.ai/integrations/openai/crewai",
    imageClassName: "px-[18px]",
  },
  {
    title: "Open WebUI",
    href: "https://github.com/open-webui/open-webui",
    imageHref: "/static/integrations/open-webui.png",
    docsHref: "https://docs.helicone.ai/other-integrations/open-webui",
    imageClassName: "px-[64px]",
  },
  {
    title: "Meta GPT",
    href: "https://github.com/geekan/MetaGPT",
    imageHref: "/static/integrations/meta-gpt.png",
    docsHref: "https://docs.helicone.ai/other-integrations/meta-gpt",
    imageClassName: "px-[12px]",
  },
  {
    title: "Open Devin",
    href: "https://github.com/OpenDevin/OpenDevin",
    imageHref: "/static/integrations/open-devin.png",
    docsHref: "https://docs.helicone.ai/other-integrations/open-devin",
  },
  {
    title: "PromptArmor",
    href: "https://promptarmor.com/",
    imageHref: "/static/integrations/prompt-armor-logo.jpeg",
    docsHref: "https://docs.helicone.ai/features/advanced-usage/llm-security",
    imageClassName: "bg-gray-500 px-[18x]",
  },
  {
    title: "Mem0 Embedchain",
    href: "https://embedchain.ai/",
    imageHref: "/static/integrations/mem0.webp",
    docsHref: "https://docs.helicone.ai/other-integrations/embedchain",
    imageClassName: "",
  },
  {
    title: "Lytix",
    href: "https://www.lytix.co/",
    imageHref: "/static/integrations/lytix.svg",
    altDocString: <> - Coming soon</>,
    docsHref: "",
    imageClassName: "px-[40px]",
  },
  {
    title: "OpenPipe",
    href: "",
    imageHref: "/static/integrations/openpipe.png",
    docsHref: "",
    altDocString: <> - Coming soon</>,
    imageClassName: "px-[40px]",
  },
  {
    title: "Ploomber",
    href: "",
    imageHref: "/static/integrations/ploomber.png",
    docsHref: "",
    altDocString: <> - Coming soon</>,
    imageClassName: "px-[12px]",
  },
];

export function Integrations() {
  return (
    <div className="grid grid-cols-4">

      {integrations.map((integration, i) => {
        return (
          <div
            id="featured"
            className="flex flex-col rounded-lg col-span-2 md:col-span-1"
            key={i}
          >
            <div className="p-4 w-full h-fit rounded-lg flex flex-col text-left text-gray-700">
              <Link
                className="font-semibold text-md p-4 w-fit hover:bg-sky-50 rounded-lg  mt-2"
                href={integration.href}
                target="_blank"
                rel="noopener noreferrer"
              >
              {/*eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={integration.imageHref}
                alt={integration.title}
                width={160}
                height={120}
                style={{
                  objectFit: "contain",
                }}
                className={clsx(
                  "rounded-lg  h-[160px] w-[160px] bg-white border border-gray-100",
                  integration.imageClassName
                )}
              />

              <div className="mt-4">{integration.title}</div>
                
              {integration.altDocString || (
                <Link
                  href={integration.docsHref}
                  className="flex gap-2 py-2 text-xs w-fit items-center font-semibold text-sky-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <p>Visit website</p>
                  <div>
                    <ArrowRightIcon
                      className={clsx("transform -rotate-45 h-4 w-4 stroke-2")}
                    />
                  </div>
                </Link>
              )}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}