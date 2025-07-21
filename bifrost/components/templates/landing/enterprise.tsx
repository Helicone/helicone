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
        className="flex w-fit items-center gap-1 rounded-lg border-2 border-violet-700 bg-violet-500 px-4 py-2 font-bold text-white shadow-lg duration-500 ease-in-out hover:bg-violet-600"
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
        className="flex w-fit items-center gap-1 rounded-lg border-2 border-violet-700 bg-violet-500 px-4 py-2 font-bold text-white shadow-lg duration-500 ease-in-out hover:bg-violet-600"
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
        className="flex w-fit items-center gap-1 rounded-lg border-2 border-violet-700 bg-violet-500 px-4 py-2 font-bold text-white shadow-lg duration-500 ease-in-out hover:bg-violet-600"
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
        className="flex w-fit items-center gap-1 rounded-lg border-2 border-violet-700 bg-violet-500 px-4 py-2 font-bold text-white shadow-lg duration-500 ease-in-out hover:bg-violet-600"
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
    <div className="flex w-full flex-col items-start gap-8 px-2 text-start md:items-center md:text-center">
      <div>
        <p className="mb-4 text-sm font-bold text-blue-600">Enterprise</p>
        <h2 className="text-start text-3xl font-bold leading-tight tracking-tight text-black md:text-center md:text-4xl">
          Get to production-quality{" "}
          <span className="text-start text-blue-600 md:text-center">
            faster
          </span>
        </h2>
      </div>

      <a
        href="/contact"
        target="_blank"
        className="flex w-fit items-center gap-1 rounded-lg border-2 border-blue-600 px-4 py-2 font-bold text-blue-600 duration-500 ease-in-out hover:bg-blue-100"
      >
        Get a Demo
      </a>

      <div className="grid w-full grid-cols-1 gap-12 pl-3 pr-5 text-start text-gray-500 md:grid-cols-3 md:gap-24">
        <div className="space-y-2">
          <h3 className="font-bold leading-tight tracking-tight text-black">
            Scalability and Reliability
          </h3>
          <p>
            Helicone is 100x more scalable than competitors, offering read and
            write abilities for millions of logs.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold leading-tight tracking-tight text-black">
            Sub-millisecond latency
          </h3>
          <p>
            As a Gateway, we deploy using Cloudflare Workers to minimize
            response time while bringing smart analytics and convenience to you.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold leading-tight tracking-tight text-black">
            Risk free experimentation
          </h3>
          <p>
            Evaluate the outputs of your new prompt without impacting production
            data (and have stats to back you up).
          </p>
        </div>
      </div>

      <div className="flex hidden w-full flex-col self-center md:flex">
        <a
          href="https://docs.helicone.ai/features/prompts#prompts-and-experiments"
          target="_blank"
          className="w-fit"
        >
          <Image
            src={enterpriseTileExperiments}
            alt="enterprise experiments graphic"
            className="w-11/12 pr-5"
          />
        </a>
        <div className="flex w-full flex-row">
          <a
            href="https://docs.helicone.ai/features/customer-portal#customer-portal"
            target="_blank"
            className="pl-2"
          >
            <Image
              src={enterpriseTileAnalytics}
              alt="enterprise analytics graphic"
              className="w-full"
            />
          </a>

          <a
            href="https://docs.helicone.ai/use-cases/etl#etl-data-extraction"
            target="_blank"
          >
            <Image
              src={enterpriseTileEtl}
              alt="enterprise etl graphic"
              className="w-full"
            />
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:hidden">
        <a
          href="https://docs.helicone.ai/features/prompts#prompts-and-experiments"
          target="_blank"
        >
          <Image
            src={enterpriseExpMobile}
            alt="enterprise experiments graphic"
          />
        </a>

        <a
          href="https://docs.helicone.ai/features/customer-portal#customer-portal"
          target="_blank"
        >
          <Image
            src={enterpriseAnalyticsMobile}
            alt="enterprise analytics graphic"
          />
        </a>

        <a
          href="https://docs.helicone.ai/use-cases/etl#etl-data-extraction"
          target="_blank"
        >
          <Image src={enterpriseEtlMobile} alt="enterprise etl graphic" />
        </a>
      </div>
    </div>
  );
};

export default Enterprise;
