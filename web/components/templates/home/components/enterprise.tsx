import React, { useState } from "react";
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
import { clsx } from "../../../shared/clsx";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import Link from "next/link";

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
    src: "/assets/home/experiment-graphic.png",
    graphic: "/assets/home/experiments-example.png",
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
    src: "/assets/home/portal-graphic.png",
    graphic: "/assets/home/portal-example.png",
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
        href="/signup"
        className="flex w-fit items-center gap-1 rounded-lg border-2 border-violet-700 bg-violet-500 px-4 py-2 font-bold text-white shadow-lg duration-500 ease-in-out hover:bg-violet-600"
      >
        Get Started
      </Link>
    ),
    src: "/assets/home/finetune-graphic.png",
    graphic: "/assets/home/finetune-example.png",
    new: false,
  },
  {
    id: "evaluations",
    name: "Evaluations",
    description: "Analyze model performance to make informed decisions.",
    src: "/assets/home/eval-graphic.png",
    bullets: [],
    cta: (
      <Link
        href="/signup"
        className="flex w-fit items-center gap-1 rounded-lg border-2 border-violet-700 bg-violet-500 px-4 py-2 font-bold text-white shadow-lg duration-500 ease-in-out hover:bg-violet-600"
      >
        Get Started
      </Link>
    ),
    graphic: "/assets/home/experiments-example.png",
    new: true,
  },
];

const Enterprise = (props: EnterpriseProps) => {
  const {} = props;

  const [activeTab, setActiveTab] = useState(ENTERPRISE_TABS[0].id);

  const currentTab = ENTERPRISE_TABS.find((tab) => tab.id === activeTab);

  return (
    <div className="flex w-full flex-col space-y-16">
      <div className="flex w-full items-start">
        <div className="flex w-full flex-col space-y-4 text-center lg:w-2/3 lg:text-left">
          <p className="text-lg font-bold text-violet-700">Enterprise</p>
          <h2 className="text-3xl font-bold sm:text-5xl sm:leading-[1.15]">
            Get to production-quality{" "}
            <span className="text-violet-800">faster</span>
          </h2>
          <p className="text-md leading-7 text-gray-500 lg:text-lg">
            Helicone makes it easy for companies to innovate faster and smarter,
            ensuring your team can stay ahead of the competition.
          </p>
        </div>
        <div className="hidden h-full w-full items-center justify-center py-12 lg:flex">
          <Image
            src={"/assets/home/enterprise-graphic.png"}
            alt={"enterprise-graphic"}
            width={550}
            height={550}
          />
        </div>
      </div>
      <ul className="hidden w-full items-center justify-between gap-8 lg:flex">
        <li className="flex w-full items-center justify-center">
          <button
            onClick={() => {
              // go the previous tab, skipping the evaluation tab, which is the last tab in the list
              const currentIndex = ENTERPRISE_TABS.findIndex(
                (tab) => tab.id === activeTab,
              );
              const previousTab = ENTERPRISE_TABS[currentIndex - 1];
              setActiveTab(
                previousTab
                  ? previousTab.id
                  : ENTERPRISE_TABS[ENTERPRISE_TABS.length - 2].id,
              );
            }}
          >
            <ChevronLeftIcon className="h-6 w-6 text-gray-500" />
          </button>
        </li>
        {ENTERPRISE_TABS.map((tab) => (
          <li key={tab.id} className="relative z-10 w-full">
            <button
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                tab.id === activeTab
                  ? "border-violet-700 bg-violet-50"
                  : "border-gray-300",
                tab.id === "evaluations"
                  ? "bg-gray-200 hover:cursor-not-allowed"
                  : "border-gray-300",
                "text-md flex h-40 w-48 flex-col items-center justify-center gap-2 rounded-lg border-2 px-8 py-4 font-semibold",
              )}
              disabled={tab.id === "evaluations"}
            >
              <Image src={tab.src} alt={tab.name} width={60} height={60} />
              {tab.name}
            </button>
            {tab.new && (
              <div className="absolute -right-4 -top-2 rotate-12 rounded-lg bg-violet-800 px-2 py-1 text-sm text-white">
                Coming Soon
              </div>
            )}
          </li>
        ))}
        <li className="flex w-full items-center justify-center">
          <button
            onClick={() => {
              // if the current tab is one before the evaluations tab, go to the first tab, otherwise go to the next tab
              const currentIndex = ENTERPRISE_TABS.findIndex(
                (tab) => tab.id === activeTab,
              );
              const nextTab = ENTERPRISE_TABS[currentIndex + 1];
              if (nextTab?.id === "evaluations") {
                setActiveTab(ENTERPRISE_TABS[0].id);
              } else {
                setActiveTab(nextTab ? nextTab.id : ENTERPRISE_TABS[0].id);
              }
            }}
          >
            <ChevronRightIcon className="h-6 w-6 text-gray-500" />
          </button>
        </li>
      </ul>
      <div className="hidden h-full w-full items-center justify-center rounded-lg border border-gray-300 lg:flex">
        <div className="grid h-full w-full grid-cols-1 rounded-lg bg-sky-50 lg:grid-cols-2">
          <div className="col-span-1 flex h-full w-full flex-col items-start space-y-2 p-8 text-left">
            <div className="flex items-center space-x-4">
              <Image
                src={currentTab?.src || "/assets/home/enterprise-graphic.png"}
                alt={currentTab?.name || "enterprise-graphic"}
                width={25}
                height={25}
              />
              <h2 className="text-3xl font-semibold">{currentTab?.name}</h2>
            </div>

            <p className="text-lg text-gray-500">{currentTab?.description}</p>
            <ul className="flex flex-col space-y-6 pt-4">
              {currentTab?.bullets?.map((bullet) => (
                <li key={bullet.text} className="flex items-center space-x-2">
                  <bullet.icon className="h-6 w-6 text-violet-700" />
                  <span className="font-semibold">{bullet.text}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4">{currentTab?.cta}</div>
          </div>
          <div className="col-span-1 flex h-full w-full items-center justify-center rounded-lg p-4">
            <Image
              src={
                currentTab?.graphic || "/assets/home/experiments-example.png"
              }
              alt={"123"}
              width={500}
              height={500}
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </div>
      <ul className="flex flex-col space-y-8 lg:hidden">
        {ENTERPRISE_TABS.filter((tab) => tab.id !== "evaluations").map(
          (tab) => (
            <div
              key={tab.id}
              className="flex h-full w-full items-center justify-center rounded-lg border border-gray-300"
            >
              <div className="grid h-full w-full grid-cols-1 rounded-lg bg-sky-50 lg:grid-cols-2">
                <div className="col-span-1 flex h-full w-full flex-col items-start space-y-2 p-8 text-left">
                  <div className="flex items-center space-x-4">
                    <Image
                      src={tab?.src || "/assets/home/enterprise-graphic.png"}
                      alt={tab?.name || "enterprise-graphic"}
                      width={20}
                      height={20}
                    />
                    <h2 className="text-2xl font-semibold">{tab?.name}</h2>
                  </div>

                  <p className="text-sm text-gray-500">{tab?.description}</p>
                  <ul className="flex flex-col space-y-6 pb-4 pt-8">
                    {tab?.bullets?.map((bullet) => (
                      <li
                        key={bullet.text}
                        className="flex items-center space-x-2"
                      >
                        <bullet.icon className="h-6 w-6 text-violet-700" />
                        <span className="text-sm font-semibold">
                          {bullet.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4">{tab?.cta}</div>
                </div>
                <div className="col-span-1 hidden h-full w-full items-center justify-center rounded-lg p-4 lg:flex">
                  <Image
                    src={
                      currentTab?.graphic ||
                      "/assets/home/experiments-example.png"
                    }
                    alt={"123"}
                    width={700}
                    height={700}
                    className="rounded-lg shadow-xl"
                  />
                </div>
              </div>
            </div>
          ),
        )}
      </ul>
    </div>
  );
};

export default Enterprise;
