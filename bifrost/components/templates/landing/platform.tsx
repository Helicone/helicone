"use client";

import { clsx } from "@/components/shared/utils";
import {
  BellIcon,
  CircleStackIcon,
  FolderArrowDownIcon,
  KeyIcon,
  TagIcon,
  UserMinusIcon,
} from "@heroicons/react/20/solid";
import {
  ChartPieIcon,
  DocumentTextIcon,
  TableCellsIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";
import Image from "next/image";
import miniRequestsPage from "@/public/static/mini-requests-page.png";
import costsGraph from "@/public/static/costs-graph.png";
import promptManagementCard from "@/public/static/prompt-management-card.png";
import uptimeCard from "@/public/static/uptime-card.png";

const features = [
  {
    name: "Labels and Feedback.",
    description:
      "Easily segment requests, environments, and more with custom properties.",
    icon: TagIcon,
  },
  {
    name: "Caching.",
    description:
      "Lower costs and improve performance as well as configure your cache responses.",
    icon: CircleStackIcon,
  },
  {
    name: "User Rate Limiting.",
    description:
      "Rate limit power users by requests, costs, and more to prevent abuse.",
    icon: UserMinusIcon,
  },
  {
    name: "Alerts.",
    description:
      "Get notified when your application is down, slow, or experiencing issues.",
    icon: BellIcon,
  },
  {
    name: "Key Vault",
    description:
      "Securely map and manage your API keys, tokens, and other secrets.",
    icon: KeyIcon,
  },
  {
    name: "Exporting.",
    description:
      "Extract, transform, and load your data using our REST API, webhooks, and more.",
    icon: FolderArrowDownIcon,
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
  const [activeTab, setActiveTab] = useState<
    "monitoring" | "logs" | "templates"
  >("monitoring");
  return (
    <div className="flex w-full flex-col items-center px-2">
      <h2 className="text-start text-3xl font-bold leading-tight tracking-tight text-black md:text-center md:text-4xl">
        One platform with{" "}
        <span className="text-sky-500">all the essential tools.</span>
      </h2>

      <div className="mt-4 flex flex-col items-start gap-4 md:mt-16 md:flex-row md:justify-stretch">
        <div className="flex h-fit h-min flex-col rounded-xl border border-gray-200 bg-gradient-to-t from-white to-sky-50 px-4 pl-1 pr-3 pt-2 md:py-8">
          <div className="flex flex-row items-center justify-between gap-2 pl-4 text-sm">
            <p className="rounded-xl bg-blue-100 p-2 text-xs font-bold text-blue-500">
              POST
            </p>
            <input
              disabled={true}
              type="text"
              className="w-full rounded-xl border border-gray-200 bg-white p-2 text-sm placeholder:text-black"
              placeholder=" / v1 / chat / completions / query "
            />
            <button className="rounded-xl bg-blue-500 p-2 text-xs text-white">
              SEND
            </button>
          </div>

          <Image src={miniRequestsPage} alt="Requests table" />
          <h3 className="relative top-[-2em] w-full self-start bg-gradient-to-t from-white via-white px-4 pb-0 pt-8 text-xl font-bold text-blue-500 md:pt-2">
            Send requests in seconds
          </h3>
          <p className="relative left-[1em] top-[-3em] bg-gradient-to-t from-white pt-2 text-gray-500 md:mb-[-3em]">
            Filter, segment, and analyze your requests
          </p>
        </div>

        <div
          className="items-auto flex h-full flex-col rounded-xl border border-gray-200 bg-gradient-to-t from-white to-sky-50 px-4 py-2 md:py-8"
          dir="rtl"
        >
          <div className="flex w-fit flex-row items-center gap-2 self-center rounded-xl border border-gray-200 bg-white p-2 pl-4 text-sm">
            <p className="rounded-lg bg-blue-100 p-2 text-xs font-bold text-blue-500">
              Costs
            </p>
            <p className="rounded-lg p-2 text-xs font-bold text-black">
              Requests
            </p>
          </div>

          <Image src={costsGraph} alt="Costs graph" />
          <h3 className="relative top-[-2em] mr-3 w-full bg-gradient-to-t from-white via-white/90 pb-0 pr-1 pt-8 text-xl font-bold text-blue-500 md:top-[-1em] md:mr-5">
            Instant Analytics
          </h3>
          <p className="relative top-[-3em] mr-3 w-full bg-gradient-to-t from-white via-white/90 pr-1 pt-3 text-gray-500 md:top-[-2em] md:mb-[-2em] md:mr-5">
            Get detailed metrics such as latency, cost, time to first token
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-stretch justify-stretch gap-4 md:mt-6 md:flex-row">
        <div className="flex flex-col rounded-xl border border-gray-200 bg-gradient-to-t from-white to-sky-50 px-4 py-4">
          <Image src={promptManagementCard} alt="Prompt management card" />
          <div className="flex flex-grow flex-col justify-end">
            <h3 className="w-full bg-gradient-to-t from-white via-white/90 pl-4 text-xl font-bold text-blue-500">
              Prompt Management
            </h3>
            <p className="w-full bg-gradient-to-t from-white via-white/90 pl-4 text-gray-500 md:bg-white">
              Access features such as prompt versioning, prompt testing and
              prompt templates
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-gradient-to-t from-white to-sky-50 py-4 pr-4 pt-2">
          <Image src={uptimeCard} alt="Uptime card" />
          <div>
            <h3 className="w-full bg-gradient-to-t from-white pl-4 text-xl font-bold text-blue-500">
              99.99% Uptime
            </h3>
            <p className="w-full bg-gradient-to-t from-white pl-4 text-gray-500">
              Helicone leverages Cloudflare Workers to maintain low latency and
              high reliability
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
