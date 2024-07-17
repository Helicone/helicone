import Link from "next/link";
import { SVGProps } from "react";
import Image from "next/image";

interface FooterProps { }

const meta = {
  social: [
    {
      name: "Twitter",
      href: "https://twitter.com/helicone_ai",
    },
    {
      name: "Discord",
      href: "https://discord.gg/2TkeWdXNPQ",
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/company/helicone/",
    },
    
  ],
};

const integrations = [
  {
    name: "Open AI"
  },
  {
    name: "Azure"
  },
  {
    name: "Anthropic"
  },
  {
    name: "Gemini"
  },
  {
    name: "Anyscale"
  },
  {
    name: "Together AI"
  },
  {
    name: "Groq"
  },
  {
    name: "OpenRouter"
  },
  {
    name: "LiteLLM"
  },
  {
    name: "Gateway"
  },
]

const versus = [
  {
    name: "Helicone vs. LangSmith"
  },
  {
    name: "Helicone vs. DataDog"
  },
  {
    name: "Helicone vs. W&B"
  },
]

const learnMore = [
  {
    name: "Documentation"
  },
  {
    name: "Pricing"
  },
  {
    name: "Community"
  },
  {
    name: "Blog"
  },
  {
    name: "Contact"
  },
]

const Footer = (props: FooterProps) => {
  const { } = props;

  return (
    <footer className="bg-inherit border-gray-200 md:bg-blue-800 ">
      <div className="md:flex md:flex-row md:justify-center md:gap-[10px] md:py-12 md:px-9">
        <div className="mt-8 md:mr-12 space-x-4 flex flex-col gap-2 ">
          <Image
            className="ml-3 md:h-8 md:w-8"
            src={"/static/logo.webp"}
            alt={"Helicone"}
            width={21.78}
            height={21.78}
          />
          <p className="text-nowrap text-gray-500 text-xs leading-5 md:text-blue-200 md:text-base">
            &copy; 2024 Helicone, Inc.{" "}
          </p>
          <p className="text-xs text-gray-500 md:text-blue-200 md:text-base">All rights reserved.</p>
        </div>
        <div className="mx-auto max-w-5xl px-4 py-8 flex grid-cols-2 justify-between md:mx-0 md:gap-4">
          <div className="flex flex-col gap-4 md:grid md:grid-cols-2 ">
            <h1 className="text-sky-500 md:text-white font-semibold text-sm md:text-base">INTEGRATIONS</h1>
            {integrations.map((integration) => (
              <p key={integration.name} className="text-gray-500 md:text-blue-200 md:font-light text-sm font-normal md:text-base ">{integration.name}</p>
            ))}
          </div>
          <div className="flex flex-col justify-between md:grid md:grid-cols-2 md:gap-12">
            <div className="flex flex-col gap-4">
              <h1 className="text-sky-500 md:text-white font-semibold text-sm md:text-base">COMPARE</h1>
              {versus.map((vs) => (
                <p key={vs.name} className="text-gray-500 md:text-blue-200 md:font-light text-sm font-normal md:text-base">{vs.name}</p>
              ))}
            </div>
            <div className="flex flex-col gap-4 ">
              <h1 className="text-sky-500 md:text-white font-semibold text-sm md:text-base">LEARN MORE</h1>
              {learnMore.map((learn) => (
                <p key={learn.name} className="text-gray-500 md:text-blue-200 md:font-light text-sm font-normal md:text-base">{learn.name}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 py-8 md:mx-0">
          <div className="flex flex-col gap-4 md:order-2">
            <h1 className="text-sky-500 md:text-white text-sm font-semibold md:text-base">SOCIALS</h1>
            {meta.social.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 md:text-white hover:text-gray-500 "
              >
                <span className="text-sm font-normal md:text-blue-200 md:font-light text-gray-500 items-left md:text-base">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
