import {
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  CodeBracketIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/20/solid";
import Link from "next/link";
import { SVGProps } from "react";
import OnboardingButton from "../../shared/auth/onboardingButton";
import { clsx } from "../../shared/clsx";
import BasePageV2 from "../../shared/layout/basePageV2";

const frequencies = [
  { value: "monthly", label: "Monthly", priceSuffix: "/month" },
  { value: "annually", label: "Annually", priceSuffix: "/year" },
];

const footerNavigation = {
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
  ],
};

const navigation = [
  {
    name: "Pricing",
    description:
      "Let us help you get back to what you do best. We'll handle the analytics.",
    href: "/pricing",
    icon: BanknotesIcon,
    target: "_self",
  },
  {
    name: "Github",
    description: "We're open source! Check out our code and contribute!",
    href: "https://github.com/Helicone/helicone",
    icon: CodeBracketIcon,
    target: "_blank",
  },
  {
    name: "Discord",
    description: "Join our vibrant community and chat with us!",
    href: "https://discord.gg/zsSTcH2qhG",
    icon: ChatBubbleLeftRightIcon,
    target: "_blank",
  },
  {
    name: "Contact",
    description: "Have a question? We're here to help!",
    href: process.env.NEXT_PUBLIC_HELICONE_CONTACT_LINK,
    icon: QuestionMarkCircleIcon,
  },
];

const tiers = [
  {
    name: "Free",
    id: "free",
    href: "#",
    price: "$0",
    description: "The basic essentials for any project using GPT-3.",
    features: [
      "Up to 1,000 requests per month",
      "Basic Support",
      "Simple Metrics",
    ],
    featured: false,
    cta: "Get Started",
  },
  {
    name: "Starter",
    id: "tier-starter",
    href: "#",
    price: "$50",
    description: "A plan that scales with your rapidly growing business.",
    features: [
      "Up to 50,000 requests per month",
      "Priority Support",
      "Advanced Insights",
      "Rate Limits and Analytics",
    ],
    featured: false,
    cta: "Get Started",
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    href: "#",
    price: "Custom",
    description: "Dedicated support and infrastructure for your company.",
    features: [
      "Over 50,000 requests per month",
      "Design Consultation",
      "Prompt Discovery",
      "Caching",
      "Custom Features and Integrations",
    ],
    featured: true,
    cta: "Contact sales",
  },
];

export default function VideoDemoPage() {
  return (
    <BasePageV2>
      <div className="w-full flex flex-col items-center gap-10">
        <h1 className="text-4xl font-bold text-center">
          Video Demo of Helicone
        </h1>
        <div className="max-w-2xl w-full ">
          <div className="relative w-full " style={{ paddingBottom: "56.25%" }}>
            <iframe
              src="https://www.loom.com/embed/4d306b85559244e3bbd07ef7ff81392f"
              className="w-full h-full absolute"
            ></iframe>
          </div>
        </div>
      </div>
    </BasePageV2>
  );
}
