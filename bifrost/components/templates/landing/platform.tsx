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
    <div className="flex flex-col w-full items-center px-2">
      <h2 className="text-3xl md:text-4xl font-bold text-black md:text-center text-start tracking-tight leading-tight">
        One platform with{" "}
        <span className="text-sky-500">all the essential tools.</span>
      </h2>

      <div className="flex flex-col md:justify-stretch md:flex-row items-start gap-4 md:mt-16 mt-4 ">
        <div className="flex flex-col h-min border border-gray-200 rounded-xl md:py-8 pt-2 px-4 pl-1 pr-3 bg-gradient-to-t from-white to-sky-50 h-fit">
          <div className="flex flex-row items-center justify-between gap-2 text-sm pl-4">
            <p className="font-bold text-xs text-blue-500 bg-blue-100 rounded-xl p-2">
              POST
            </p>
            <input
              disabled={true}
              type="text"
              className="text-sm border border-gray-200 w-full bg-white rounded-xl p-2 placeholder:text-black"
              placeholder=" / v1 / chat / completions / query "
            />
            <button className="bg-blue-500 text-xs text-white rounded-xl p-2">
              SEND
            </button>
          </div>

          <Image src={miniRequestsPage} alt="Requests table" />
          <h3 className="text-xl font-bold text-blue-500 relative top-[-2em] bg-gradient-to-t from-white via-white self-start w-full pt-8 md:pt-2 px-4 pb-0">
            Send requests in seconds
          </h3>
          <p className="relative top-[-3em] md:mb-[-3em] pt-2 left-[1em] text-gray-500 bg-gradient-to-t from-white">
            Filter, segment, and analyze your requests
          </p>
        </div>

        <div
          className="flex flex-col items-auto border border-gray-200 rounded-xl md:py-8 py-2 px-4 bg-gradient-to-t from-white to-sky-50 h-full"
          dir="rtl"
        >
          <div className="flex flex-row items-center gap-2 text-sm pl-4 bg-white border border-gray-200 rounded-xl p-2 w-fit self-center">
            <p className="font-bold text-xs text-blue-500 bg-blue-100 rounded-lg p-2">
              Costs
            </p>
            <p className="font-bold text-xs text-black rounded-lg p-2">
              Requests
            </p>
          </div>

          <Image src={costsGraph} alt="Costs graph" />
          <h3 className="text-xl font-bold text-blue-500 relative md:top-[-1em] top-[-2em] bg-gradient-to-t from-white via-white/90 pt-8 md:mr-5 mr-3 pr-1 pb-0 w-full">
            Instant Analytics
          </h3>
          <p className="relative md:top-[-2em] md:mb-[-2em] top-[-3em] md:mr-5 mr-3 pt-3 pr-1 bg-gradient-to-t from-white via-white/90 text-gray-500 w-full">
            Get detailed metrics such as latency, cost, time to first token
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch justify-stretch gap-4 mt-4 md:mt-6">
        <div className="flex flex-col border border-gray-200 rounded-xl py-4 px-4 bg-gradient-to-t from-white to-sky-50">
          <Image src={promptManagementCard} alt="Prompt management card" />
          <div className="flex flex-col justify-end flex-grow">
            <h3 className="text-xl font-bold text-blue-500 bg-gradient-to-t from-white via-white/90 pl-4 w-full">
              Prompt Management
            </h3>
            <p className="bg-gradient-to-t from-white via-white/90 md:bg-white text-gray-500 w-full pl-4">
              Access features such as prompt versioning, prompt testing and
              prompt templates
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between border border-gray-200 rounded-xl py-4 pt-2 pr-4 bg-gradient-to-t from-white to-sky-50">
          <Image src={uptimeCard} alt="Uptime card" />
          <div>
            <h3 className="text-xl font-bold text-blue-500 bg-gradient-to-t from-white w-full pl-4">
              99.99% Uptime
            </h3>
            <p className="bg-gradient-to-t from-white text-gray-500 w-full pl-4">
              Helicone leverages Cloudflare Workers to maintain low latency and
              high reliability
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
