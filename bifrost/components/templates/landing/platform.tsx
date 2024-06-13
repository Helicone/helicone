"use client";

import { clsx } from "@/components/shared/utils";
import { PiTerminalBold } from "react-icons/pi";
import {
  ChartPieIcon,
  DocumentTextIcon,
  TableCellsIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";
import Image from "next/image";

const features = [
  {
    name: "Prompts",
    description:
      "Monitor Prompts Version.",
    icon: PiTerminalBold,
  },
  {
    name: "Custom Properties",
    description:
      "Label & segment requests.",
    icon: PiTerminalBold,
  },
  {
    name: "Caching",
    description:
      "Save money & improve latency.",
    icon: PiTerminalBold,
  },
  {
    name: "Omitting Logs",
    description:
      "Remove requests and responses.",
    icon: PiTerminalBold,
  },
  {
    name: "User Metrics",
    description:
      "Get insights into your user's usage .",
    icon: PiTerminalBold,
  },
  {
    name: "Feedback",
    description:
      "Provide user feedback on outputs. ",
    icon: PiTerminalBold,
  },
  {
    name: "Scores",
    description:
      "Score your requests and experiments.",
    icon: PiTerminalBold,
  },
  {
    name: "Gateway Fallback",
    description:
      "Use any provider via a single endpoint.",
    icon: PiTerminalBold,
  },
  {
    name: "Retries",
    description:
      "Smartly retry requests.",
    icon: PiTerminalBold,
  },
  {
    name: "Rate Limiting",
    description:
      "Easily rate limit power users.",
    icon: PiTerminalBold,
  },
  {
    name: "KeyVault",
    description:
      "Manage and distribute your provider API keys securely.",
    icon: PiTerminalBold,
  },
  {
    name: "Moderation Integration",
    description:
      "Integrate OpenAi moderation to safeguard your chat completion.",
    icon: PiTerminalBold,
  },
  {
    name: "LLM Security",
    description:
      "Secure OpenAI chat completions against prompt injections.",
    icon: PiTerminalBold,
  },
];

const tabs = [
  {
    key: "monitoring",
    name: "Monitoring and Analytics",
    description: "Monitor performance and analyze data in real-time",
    icon: ChartPieIcon,
    src: "/static/platform/dashboard.webp",
  },
  {
    key: "logs",
    name: "Request Logs",
    description: "View and search logs for your requests",
    icon: TableCellsIcon,
    src: "/static/platform/request.webp",
  },
  {
    key: "templates",
    name: "Prompt Templates",
    description: "Create and manage templates for your requests",
    icon: DocumentTextIcon,
    src: "/static/platform/prompt.webp",
  },
];

export default function Platform() {
  return (
    <>
      <div className="flex flex-col space-y-4 w-full items-center">
        <h2 className="text-3xl md:text-4xl font-bold text-black tracking-tight leading-tight">
          No packages, just{" "}
          <span className="text-sky-500 ">headers</span>
        </h2>
        <p className="text-md md:text-md text-gray-600 max-w-4xl font-light">
          Access just about every Helicone features in seconds.
        </p>
      </div>
      <div className="relative overflow-hidden pt-2">
        <div className="mx-auto max-w-8xl px-6 lg:px-8">
          
          <div className="relative" aria-hidden="true">
            <div/>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-16 max-w-8xl sm:mt-20 md:mt-24 lg:px-8">
        <dl className="mx-auto grid max-w-2xl grid-cols-2 gap-x-6 gap-y-10 text-base leading-7 text-gray-600 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
          {features.map((feature) => (
            <div key={feature.name} className="relative" >
                <feature.icon
                  className="ableft-1 top-1 h-5 w-5 text-sky-500 "
                  aria-hidden="true"
                />
              <dt className="inline font-semibold text-nowrap text-sm text-sky-500">
                {feature.name}
              </dt>{" "}
              <dd className="font-light text-sm pt-1">{feature.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
