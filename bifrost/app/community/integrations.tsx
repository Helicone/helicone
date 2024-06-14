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
  },

  {
    title: "PromptArmor",
    href: "https://promptarmor.com/",
    imageHref: "/static/integrations/prompt_armor.svg",
    docsHref: "https://docs.helicone.ai/features/advanced-usage/llm-security",
    imageClassName: "bg-gray-500",
  },
  {
    title: "Big-AGI",
    href: "https://github.com/enricoros/big-agi?tab=readme-ov-file",
    imageHref: "/static/integrations/big_agi.png",
    docsHref: "https://github.com/enricoros/big-agi?tab=readme-ov-file",
    imageClassName: "px-[24px]",
  },
  {
    title: "LangChain",
    href: "https://www.langchain.com/",
    imageHref: "/static/integrations/langchain.jpeg",
    docsHref: "https://docs.helicone.ai/integrations/openai/langchain",
  },
  {
    title: "LLamaIndex",
    href: "https://www.llamaindex.ai/",
    imageHref: "/static/integrations/llamaindex.png",
    docsHref: "",
    altDocString: <>Coming soon</>,
  },
  {
    title: "Lytix",
    href: "https://www.lytix.co/",
    imageHref: "/static/integrations/lytix.svg",
    altDocString: <>Coming soon</>,
    docsHref: "",
    imageClassName: "px-[40px]",
  },
  {
    title: "OpenPipe",
    href: "",
    imageHref: "/static/integrations/openpipe.png",
    docsHref: "",
    altDocString: <>Coming soon</>,
    imageClassName: "px-[40px]",
  },
  {
    title: "Ploomber",
    href: "",
    imageHref: "/static/integrations/ploomber.png",
    docsHref: "",
    altDocString: <>Coming soon</>,
  },
];

export function Integrations() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 px-[12px] md:gap-5">
      {integrations.map((integration, i) => {
        return (
          <div
            id="featured"
            className="flex flex-col rounded-lg col-span-1 md:col-span-1 "
            key={i}
          >
            {/*eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={integration.imageHref}
              alt={integration.title}
              width={160}
              height={160}
              style={{
                objectFit: "contain",
              }}
              className={clsx(
                "rounded-lg  h-[160px] w-[160px] p-[12px] ",
                integration.imageClassName
              )}
            />

            <div className="px-[12px] pt-[4px] w-full h-fit rounded-lg flex flex-col text-left text-gray-500">
              <Link
                className="font-extrabold text-lg w-fit"
                href={integration.href}
              >
                {integration.title}
              </Link>
              {integration.altDocString || (
                <Link
                  href={integration.docsHref}
                  className="flex gap-2 text-sm w-fit items-center font-semibold"
                >
                  <p>View doc </p>
                  <div>
                    <ArrowRightIcon
                      className={clsx("transform -rotate-45 h-4 w-4 stroke-2")}
                    />
                  </div>
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
