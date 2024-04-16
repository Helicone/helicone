import React, { useState } from "react";
import Image from "next/image";
import {
  BeakerIcon,
  ChartBarIcon,
  ChartPieIcon,
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
  bullets?: {
    icon: React.ForwardRefExoticComponent<
      Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
        title?: string | undefined;
        titleId?: string | undefined;
      } & React.RefAttributes<SVGSVGElement>
    >;
    text: string;
  }[];
  cta?: React.ReactNode;
  src: string;
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
    src: "/assets/home/experiment-graphic.png",
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
    src: "/assets/home/portal-graphic.png",
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
        className="bg-violet-500 hover:bg-violet-600 ease-in-out duration-500 text-white border-2 border-violet-700 rounded-lg px-4 py-2 font-bold shadow-lg flex w-fit items-center gap-1"
      >
        Get Started
      </Link>
    ),
    src: "/assets/home/finetune-graphic.png",
    new: false,
  },
  {
    id: "evaluations",
    name: "Evaluations",
    description: "Analyze model performance to make informed decisions.",
    src: "/assets/home/eval-graphic.png",
    new: true,
  },
];

const Enterprise = (props: EnterpriseProps) => {
  const {} = props;

  const [activeTab, setActiveTab] = useState(ENTERPRISE_TABS[0].id);

  const currentTab = ENTERPRISE_TABS.find((tab) => tab.id === activeTab);

  return (
    <div className="flex flex-col space-y-8 w-full">
      <div className="flex items-start w-full">
        <div className="flex flex-col space-y-4 w-full md:w-2/3 text-center md:text-left">
          <p className="text-lg font-bold text-violet-700">Enterprise</p>
          <h2 className="text-3xl sm:text-5xl font-bold sm:leading-[1.15]">
            Get to production-quality{" "}
            <span className="text-violet-700">faster</span>
          </h2>
          <p className="text-md md:text-lg text-gray-500 leading-7">
            Helicone makes it easy for companies to innovate faster and smarter,
            ensuring your team can stay ahead in the AI revolution.
          </p>
        </div>
        <div className="w-full h-full hidden md:flex items-center justify-center py-12">
          <Image
            src={"/assets/home/enterprise-graphic.png"}
            alt={"enterprise-graphic"}
            width={550}
            height={550}
          />
        </div>
      </div>
      <ul className="w-full hidden md:flex justify-between items-center gap-8 pt-8">
        <li className="flex items-center justify-center w-full">
          <button
            onClick={() => {
              // go the previous tab, skipping the evaluation tab, which is the last tab in the list
              const currentIndex = ENTERPRISE_TABS.findIndex(
                (tab) => tab.id === activeTab
              );
              const previousTab = ENTERPRISE_TABS[currentIndex - 1];
              setActiveTab(
                previousTab
                  ? previousTab.id
                  : ENTERPRISE_TABS[ENTERPRISE_TABS.length - 2].id
              );
            }}
          >
            <ChevronLeftIcon className="h-6 w-6 text-gray-500" />
          </button>
        </li>
        {ENTERPRISE_TABS.map((tab) => (
          <li key={tab.id} className="w-full z-10 relative">
            <button
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                tab.id === activeTab
                  ? "border-violet-700 bg-violet-50"
                  : "border-gray-300",
                tab.id === "evaluations"
                  ? "bg-gray-200 hover:cursor-not-allowed"
                  : "border-gray-300",
                "w-48 h-40 justify-center text-md border-2 px-8 py-4 rounded-lg font-semibold flex flex-col items-center gap-2"
              )}
              disabled={tab.id === "evaluations"}
            >
              <Image src={tab.src} alt={tab.name} width={60} height={60} />
              {tab.name}
            </button>
            {tab.new && (
              <div className="absolute -top-2 -right-4 bg-violet-700 text-white px-2 py-1 text-sm rounded-lg rotate-12">
                Coming Soon
              </div>
            )}
          </li>
        ))}
        <li className="flex items-center justify-center w-full">
          <button
            onClick={() => {
              // if the current tab is one before the evaluations tab, go to the first tab, otherwise go to the next tab
              const currentIndex = ENTERPRISE_TABS.findIndex(
                (tab) => tab.id === activeTab
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
      <div className="h-full w-full border border-gray-300 rounded-lg hidden md:flex items-center justify-center">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 h-full bg-sky-50 rounded-lg">
          <div className="col-span-1 h-full w-full flex flex-col items-start p-8 text-left space-y-2">
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
            <ul className="pt-4 flex flex-col space-y-6">
              {currentTab?.bullets?.map((bullet) => (
                <li key={bullet.text} className="flex items-center space-x-2">
                  <bullet.icon className="h-6 w-6 text-violet-700" />
                  <span className="font-semibold">{bullet.text}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4">{currentTab?.cta}</div>
          </div>
          <div className="col-span-1 h-full w-full border border-gray-300 rounded-lg"></div>
        </div>
      </div>
      <ul className="flex flex-col md:hidden space-y-8">
        {ENTERPRISE_TABS.filter((tab) => tab.id !== "evaluations").map(
          (tab) => (
            <div className="h-full w-full border border-gray-300 rounded-lg flex items-center justify-center">
              <div className="w-full grid grid-cols-1 md:grid-cols-2 h-full bg-sky-50 rounded-lg">
                <div className="col-span-1 h-full w-full flex flex-col items-start p-8 text-left space-y-2">
                  <div className="flex items-center space-x-4">
                    <Image
                      src={tab?.src || "/assets/home/enterprise-graphic.png"}
                      alt={tab?.name || "enterprise-graphic"}
                      width={25}
                      height={25}
                    />
                    <h2 className="text-3xl font-semibold">{tab?.name}</h2>
                  </div>

                  <p className="text-lg text-gray-500">{tab?.description}</p>
                  <ul className="pt-4 flex flex-col space-y-6">
                    {tab?.bullets?.map((bullet) => (
                      <li
                        key={bullet.text}
                        className="flex items-center space-x-2"
                      >
                        <bullet.icon className="h-6 w-6 text-violet-700" />
                        <span className="font-semibold">{bullet.text}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4">{tab?.cta}</div>
                </div>
                <div className="col-span-1 h-full w-full border border-gray-300 rounded-lg"></div>
              </div>
            </div>
          )
        )}
      </ul>
    </div>
  );
};

export default Enterprise;
