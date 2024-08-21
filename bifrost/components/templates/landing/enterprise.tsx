import React from "react";
import Image from "next/image";
import {
  BeakerIcon,
  ChartBarIcon,
  CircleStackIcon,
  DocumentTextIcon,
  FolderArrowDownIcon,
  HandThumbUpIcon,
  PaintBrushIcon,
  UserGroupIcon,
  WrenchIcon,
} from "@heroicons/react/20/solid";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { clsx } from "@/components/shared/utils";
import enterpriseTileExperiments from "@/public/static/enterprise-tile-exp.png";
import enterpriseTileAnalytics from "@/public/static/enterprise-tile-analytics.png";
import enterpriseTileEtl from "@/public/static/enterprise-tile-etl.png";
import enterpriseExpMobile from "@/public/static/enterprise-exp-mobile.png";
import enterpriseAnalyticsMobile from "@/public/static/enterprise-analytics-mobile.png";
import enterpriseEtlMobile from "@/public/static/enterprise-etl-mobile.png";

interface EnterpriseProps {}

const ENTERPRISE_TABS: {
  id: string;
  name: string;
  description: string;
  bullets: {
    icon: React.ForwardRefExoticComponent<
      Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
        title?: string | undefined;
        titleId?: string | undefined;
      } & React.RefAttributes<SVGSVGElement>
    >;
    text: string;
  }[];
  cta: React.ReactNode;
  src: string;
  graphic: string;
  new: boolean;
}[] = [
  {
    id: "experiments",
    name: "Experiments",
    description:
      "Test prompt changes and analyze results with ease. Easily version prompts and compare results across datasets",
    bullets: [
      {
        icon: DocumentTextIcon,
        text: "Prompt Regression Testing",
      },
      {
        icon: BeakerIcon,
        text: "Version and Test",
      },
      {
        icon: CircleStackIcon,
        text: "Dataset Comparison and Analysis",
      },
    ],
    cta: (
      <Link
        href="/contact"
        className="bg-violet-500 hover:bg-violet-600 ease-in-out duration-500 text-white border-2 border-violet-700 rounded-lg px-4 py-2 font-bold shadow-lg flex w-fit items-center gap-1"
      >
        Schedule a Demo
      </Link>
    ),
    src: "/static/enterprise/experiment-graphic.webp",
    graphic: "/static/enterprise/experiments-example.webp",
    new: false,
  },
  {
    id: "portal",
    name: "Customer Portal",
    description:
      "Share Helicone dashboards with your team and clients. Easily manage permissions and access.",
    bullets: [
      {
        icon: ChartBarIcon,
        text: "Share Dashboards",
      },
      {
        icon: UserGroupIcon,
        text: "Manage Rate-Limits and Permissions",
      },
      {
        icon: PaintBrushIcon,
        text: "Customize Branding and Look and Feel",
      },
    ],
    cta: (
      <Link
        href="/contact"
        className="bg-violet-500 hover:bg-violet-600 ease-in-out duration-500 text-white border-2 border-violet-700 rounded-lg px-4 py-2 font-bold shadow-lg flex w-fit items-center gap-1"
      >
        Schedule a Demo
      </Link>
    ),
    src: "/static/enterprise/portal-graphic.webp",
    graphic: "/static/enterprise/portal-example.webp",
    new: false,
  },
  {
    id: "fine-tuning",
    name: "Fine-Tuning",
    description:
      "Collect feedback and improve model performance over time. We make it easy to fine-tune and export data.",
    bullets: [
      {
        icon: WrenchIcon,
        text: "Fine-tune OpenAI Models",
      },
      {
        icon: HandThumbUpIcon,
        text: "Collect and label data for fine-tuning",
      },
      {
        icon: FolderArrowDownIcon,
        text: "Export Data as CSV or JSONL",
      },
    ],
    cta: (
      <Link
        href="https://us.helicone.ai/signup"
        className="bg-violet-500 hover:bg-violet-600 ease-in-out duration-500 text-white border-2 border-violet-700 rounded-lg px-4 py-2 font-bold shadow-lg flex w-fit items-center gap-1"
      >
        Get Started
      </Link>
    ),
    src: "/static/enterprise/finetune-graphic.webp",
    graphic: "/static/enterprise/finetune-example.webp",
    new: false,
  },
  {
    id: "evaluations",
    name: "Evaluations",
    description: "Analyze model performance to make informed decisions.",
    src: "/static/enterprise/eval-graphic.webp",
    bullets: [],
    cta: (
      <Link
        href="https://us.helicone.ai/signup"
        className="bg-violet-500 hover:bg-violet-600 ease-in-out duration-500 text-white border-2 border-violet-700 rounded-lg px-4 py-2 font-bold shadow-lg flex w-fit items-center gap-1"
      >
        Get Started
      </Link>
    ),
    graphic: "/static/enterprise/experiments-example.webp",
    new: true,
  },
];

const Enterprise = (props: EnterpriseProps) => {

  return (
    <div className="flex flex-col gap-8 px-2 w-full md:items-center items-start md:text-center text-start">

      <div>
        <p className="text-blue-600 text-sm font-bold mb-4">Enterprise</p>
        <h2 className="text-3xl md:text-4xl font-bold text-black md:text-center text-start tracking-tight leading-tight">
          Get to production-quality{" "}
          <span className="text-blue-600 md:text-center text-start">faster</span>
        </h2>
      </div>

      <a href="/contact" target="_blank" className="hover:bg-blue-100 ease-in-out duration-500 text-blue-600 border-2 border-blue-600 rounded-lg px-4 py-2 font-bold flex w-fit items-center gap-1">
        Get a Demo
      </a>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-24 w-full text-start text-gray-500 pl-3 pr-5">
        <div className="space-y-2">
          <h3 className="font-bold text-black tracking-tight leading-tight">
            Scalability and Reliability
          </h3>
          <p>Helicone is 100x more scalable than competitors, offering read and write abilities for millions of logs.</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-black tracking-tight leading-tight">
            Sub-millisecond latency
          </h3>
          <p>As a Gateway, we deploy using Cloudflare Workers to minimize response time while bringing smart analytics and convenience to you.</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-black tracking-tight leading-tight">
            Risk free experimentation
          </h3>
          <p>Evaluate the outputs of your new prompt without impacting production data (and have stats to back you up).</p>
        </div>

      </div>

      <div className="self-center md:flex hidden flex flex-col w-full">
        <a href="https://docs.helicone.ai/features/prompts#prompts-and-experiments" target="_blank" className="w-fit">
          <Image src={enterpriseTileExperiments} alt="enterprise experiments graphic" className="w-11/12 pr-5" />
        </a>
        <div className="flex flex-row w-full">
          <a href="https://docs.helicone.ai/features/customer-portal#customer-portal" target="_blank" className="pl-2">
            <Image src={enterpriseTileAnalytics} alt="enterprise analytics graphic" className="w-full" />
          </a>

          <a href="https://docs.helicone.ai/use-cases/etl#etl-data-extraction" target="_blank">
            <Image src={enterpriseTileEtl} alt="enterprise etl graphic" className="w-full" />
          </a>
        </div>
      </div>
      
      <div className="md:hidden flex flex-col gap-4">
        <a href="https://docs.helicone.ai/features/prompts#prompts-and-experiments" target="_blank">
          <Image src={enterpriseExpMobile} alt="enterprise experiments graphic" />
        </a>

        <a href="https://docs.helicone.ai/features/customer-portal#customer-portal" target="_blank">
          <Image src={enterpriseAnalyticsMobile} alt="enterprise analytics graphic" />
        </a>

        <a href="https://docs.helicone.ai/use-cases/etl#etl-data-extraction" target="_blank">
          <Image src={enterpriseEtlMobile} alt="enterprise etl graphic" />
        </a>
      </div>
    </div>
  );
};

export default Enterprise;
