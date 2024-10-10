"use client";
import Link from "next/link";
import { SVGProps } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface FooterProps {}

const meta = {
  social: [
    {
      name: "Twitter",
      href: "https://twitter.com/helicone_ai",
      icon: (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      ),
    },
    {
      name: "GitHub",
      href: "https://github.com/Helicone/helicone",
      icon: (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: "Discord",
      href: "https://discord.gg/2TkeWdXNPQ",
      icon: (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
        <div>
          <Image
            src="/static/discord-icon.svg"
            className="grayscale"
            alt="Discord"
            width={24}
            height={24}
          />
        </div>
      ),
    },
  ],
};

const Footer = () => {
  const path = usePathname();

  return (
    <footer
      className={`grid grid-cols-2 md:grid-cols-5 py-6 gap-y-8 pl-8 md:pl-0 md:justify-items-center items-start ${
        path === "/"
          ? " bg-[#2B3AC7] text-white/70 fill-white stroke-white"
          : "bg-inherit text-black/60 fill-[#5D6673] stroke-[#5D6673]"
      }`}
    >
      <div className="flex flex-col items-start font-light text-sm tracking-wide gap-1 col-span-2 md:col-span-1 justify-self-start md:justify-self-center">
        <Image
          src="/static/logo-text.svg"
          alt="Bifrost"
          width={150}
          height={150}
        />
        <p className="mt-2">&copy; 2024 Helicone, Inc</p>
        <p className="">All rights reserved.</p>
      </div>

      <div className="">
        <p className="text-sm tracking-wide font-bold mb-2">INTEGRATIONS</p>
        <div className="grid grid-cols-1 md:grid-cols-2 items-start font-light text-sm tracking-wide gap-x-8 gap-y-2">
          <a
            className="hover:underline"
            href="https://docs.helicone.ai/integrations/openai/javascript"
            target="_blank"
          >
            OpenAI
          </a>
          <a
            className="hover:underline"
            href="https://docs.helicone.ai/integrations/anthropic/javascript"
            target="_blank"
          >
            Anthropic
          </a>
          <a
            className="hover:underline"
            href="https://docs.helicone.ai/integrations/azure/javascript"
            target="_blank"
          >
            Azure
          </a>
          <a
            className="hover:underline"
            href="https://docs.helicone.ai/getting-started/integration-method/litellm#litellm-integration"
            target="_blank"
          >
            LiteLLM
          </a>
          <a
            className="hover:underline"
            href="https://docs.helicone.ai/getting-started/integration-method/anyscale#anyscale-integration"
            target="_blank"
          >
            Anyscale
          </a>
          <a
            className="hover:underline"
            href="https://docs.helicone.ai/getting-started/integration-method/together#together-ai-integration"
            target="_blank"
          >
            Together AI
          </a>
          <a
            className="hover:underline"
            href="https://docs.helicone.ai/getting-started/integration-method/openrouter#openrouter-integration"
            target="_blank"
          >
            OpenRouter
          </a>
          <a
            className="hover:underline"
            href="https://docs.helicone.ai/getting-started/quick-start#other-integrations"
            target="_blank"
          >
            Other
          </a>
        </div>
      </div>

      <div className="">
        <p className="font-bold text-sm tracking-wide mb-2">COMPARE</p>
        <div className="flex flex-col items-start font-light text-sm tracking-wide gap-2">
          <a
            className="hover:underline"
            href="/blog/best-langsmith-alternatives"
            target="_blank"
          >
            Helicone vs Langsmith
          </a>
          <a
            className="hover:underline"
            href="/blog/best-datadog-alternative-for-llm"
            target="_blank"
          >
            Helicone vs Datadog
          </a>
          <a
            className="hover:underline"
            href="/blog/weights-and-biases"
            target="_blank"
          >
            Helicone vs Weights & Biases
          </a>
        </div>
      </div>

      <div className="">
        <p className="font-bold text-sm tracking-wide mb-2">LEARN MORE</p>
        <div className="flex flex-col items-start font-light text-sm tracking-wide gap-2">
          <a
            className="hover:underline"
            href="https://docs.helicone.ai"
            target="_blank"
          >
            Docs
          </a>
          <a className="hover:underline" href="/blog" target="_blank">
            Blog
          </a>
          <a className="hover:underline" href="/pricing" target="_blank">
            Pricing
          </a>
          <a
            className="hover:underline"
            href="https://us.helicone.ai/open-stats"
            target="_blank"
          >
            Stats
          </a>
          <a className="hover:underline" href="/community" target="_blank">
            Community
          </a>
          <a className="hover:underline" href="/changelog" target="_blank">
            Changelog
          </a>
          <a className="hover:underline" href="/terms" target="_blank">
            Terms
          </a>
          <a className="hover:underline" href="/privacy" target="_blank">
            Privacy
          </a>
        </div>
      </div>

      <div className="">
        <p className="font-bold mb-2 text-sm tracking-wide">CONNECT</p>
        <div className="flex flex-col items-start font-light text-sm tracking-wide gap-2">
          <a
            className="hover:underline"
            href="https://twitter.com/helicone_ai"
            target="_blank"
          >
            Twitter
          </a>
          <a
            className="hover:underline"
            href="https://www.linkedin.com/company/helicone/"
            target="_blank"
          >
            LinkedIn
          </a>
          <a
            className="hover:underline"
            href="https://discord.gg/2TkeWdXNPQ"
            target="_blank"
          >
            Discord
          </a>
          <a
            className="hover:underline"
            href="mailto:contact@helicone.ai"
            target="_blank"
          >
            Email
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
