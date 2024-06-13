import { clsx } from "@/utils/clsx";
import Link from "next/link";

interface Integration {
  title: string;
  href: string;
  imageHref: string;
  docsHref: string;
}

const integrations: Integration[] = [
  {
    title: "PostHog",
    href: "https://posthog.com",
    imageHref: "/static/integrations/posthog.webp",
    docsHref: "https://posthog.com/docs/ai-engineering/helicone-posthog",
  },
  {
    title: "OpenPipe",
    href: "",
    imageHref: "/static/deep-learning.jpg",
    docsHref: "",
  },
  {
    title: "PromptArmor",
    href: "",
    imageHref: "/static/deep-learning.jpg",
    docsHref: "",
  },
  {
    title: "Lytix",
    href: "",
    imageHref: "/static/deep-learning.jpg",
    docsHref: "",
  },
  {
    title: "Ploomber",
    href: "",
    imageHref: "/static/deep-learning.jpg",
    docsHref: "",
  },
  {
    title: "Big-AGI",
    href: "",
    imageHref: "/static/deep-learning.jpg",
    docsHref: "",
  },
  {
    title: "LangChain",
    href: "",
    imageHref: "/static/deep-learning.jpg",
    docsHref: "",
  },
  {
    title: "LLamaIndex",
    href: "",
    imageHref: "/static/deep-learning.jpg",
    docsHref: "",
  },
];

export function Integrations() {
  return (
    <div className="grid grid-cols-2 space-y-5">
      {integrations.map((integration, i) => {
        return (
          <div
            id="featured"
            className="flex flex-col gap-2 w-full px-1   rounded-lg col-span-1 md:col-span-1 "
            key={i}
          >
            {/*eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={integration.imageHref}
              alt={integration.title}
              width={400}
              height={300}
              style={{
                objectFit: "cover",
              }}
              className="rounded-lg  w-full border border-gray-300"
            />
            <div className="w-full h-fit rounded-lg flex flex-col text-left font-extrabold text-gray-500">
              <Link
                className="font-semibold text-lg pt-2  w-fit"
                href={integration.href}
              >
                {integration.title}
              </Link>
              <Link
                href={integration.docsHref}
                className="flex gap-3 text-sm w-fit"
              >
                View doc <div>ar</div>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
