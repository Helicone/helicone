import {
  ArrowPathIcon,
  BeakerIcon,
  ChartPieIcon,
  CircleStackIcon,
  CodeBracketSquareIcon,
  UserGroupIcon,
  BellAlertIcon,
  PresentationChartBarIcon,
  TableCellsIcon,
  UserIcon,
  StopCircleIcon,
  KeyIcon,
  ShieldCheckIcon,
  ChatBubbleBottomCenterTextIcon,
  RectangleGroupIcon,
  InboxStackIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  HandThumbUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import Image from "next/image";
import React, { useState } from "react";
import { clsx } from "../../../shared/clsx";
import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  AccordionList,
} from "@tremor/react";
import Link from "next/link";

interface FeaturesProps {}

const tabOptions: {
  id: string;
  title: string;
  icon: React.ReactNode;
  highlight: string;
  content: React.ReactNode;
}[] = [
  {
    id: "monitoring",
    title: "Monitoring",
    icon: <ChartPieIcon className="h-6 w-6 text-violet-500" />,
    content: (
      <div className="my-2 grid h-full w-full grid-cols-8 gap-8 bg-violet-500 p-8 md:my-8 md:rounded-lg md:p-16">
        <div className="col-span-8 flex flex-col space-y-4 text-white md:col-span-3">
          <h2 className="text-3xl font-bold tracking-tight">Monitoring</h2>
          <p className="text-md max-w-xs font-medium text-gray-300">
            Understand how your application is performing with our monitoring
            tools
          </p>
          <Link
            className="w-fit rounded-lg border border-white bg-violet-500 px-4 py-2 text-sm font-bold hover:bg-violet-500"
            href={"/signup"}
          >
            Start Monitoring
          </Link>
          <ul className="text-md grid w-fit grid-cols-2 gap-4 pt-4 font-bold md:gap-6">
            <li className="flex items-center gap-2">
              <PresentationChartBarIcon className="h-6 w-6" /> Dashboards
            </li>
            <li className="flex items-center gap-2">
              <TableCellsIcon className="h-6 w-6" /> Logs
            </li>
            <li className="flex items-center gap-2">
              <BellAlertIcon className="h-6 w-6" /> Alerts
            </li>
            <li className="flex items-center gap-2">
              <UserIcon className="h-6 w-6" /> User Insights
            </li>
          </ul>
        </div>
        <div className="relative col-span-8 hidden w-full items-center justify-center md:col-span-5 md:flex">
          <Image
            className="absolute -bottom-4 z-20 block max-h-72 w-fit rounded-lg border border-gray-300 object-contain shadow-lg lg:col-span-1"
            src="/assets/home/bento/requests.webp"
            alt="requests"
            width={980}
            height={604}
          />
          <Image
            className="absolute right-0 top-0 z-10 col-span-2 block max-h-64 w-fit rotate-12 rounded-lg border border-gray-300 object-contain shadow-lg lg:col-span-1"
            src="/assets/home/bento/users.webp"
            alt="users"
            width={980}
            height={604}
          />
          <Image
            className="absolute left-0 top-0 col-span-2 block max-h-64 w-fit -rotate-6 rounded-lg border border-gray-300 object-contain shadow-lg lg:col-span-1"
            src="/assets/home/bento/costs.webp"
            alt="costs"
            width={908}
            height={608}
          />
        </div>
      </div>
    ),
    highlight: "bg-violet-700",
  },
  {
    id: "gateway",
    title: "Gateway",
    icon: <ArrowPathIcon className="h-6 w-6 text-green-500" />,
    content: (
      <div className="my-2 grid h-full w-full grid-cols-8 gap-8 bg-green-300 p-8 md:my-8 md:rounded-lg md:p-16">
        <div className="col-span-8 flex w-full flex-col space-y-4 text-black">
          <h2 className="text-3xl font-bold tracking-tight">Gateway</h2>
          <p className="text-md font-medium">
            Within our proxy, we offer caching, rate limiting, prompt detection,
            key vault, and much more...
          </p>
          <Link
            href="/signup"
            className="w-fit rounded-lg border border-black bg-green-400 px-4 py-2 text-sm font-bold hover:bg-green-500"
          >
            Get integrated in minutes
          </Link>
        </div>
        <div className="relative z-20 col-span-8 hidden w-full items-center justify-center object-contain md:flex">
          <div className="absolute -bottom-16 left-0 flex h-56 w-56 -rotate-3 flex-col items-center justify-center space-y-4 rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
            <CircleStackIcon className="h-16 w-16 text-green-500" />
            <p className="text-3xl font-bold">Caching</p>
          </div>
          <div className="absolute -bottom-16 left-48 z-30 hidden h-56 w-56 rotate-6 flex-col items-center justify-center space-y-4 rounded-lg border border-gray-300 bg-white p-4 shadow-lg lg:flex">
            <StopCircleIcon className="h-16 w-16 text-green-500" />
            <p className="text-3xl font-bold">Rate Limiting</p>
          </div>
          <div className="absolute -bottom-16 z-50 flex h-56 w-56 flex-col items-center justify-center space-y-4 rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
            <ShieldCheckIcon className="h-16 w-16 text-green-500" />
            <p className="text-center text-3xl font-bold">Prompt Detection</p>
          </div>
          <div className="absolute -bottom-16 right-48 z-40 hidden h-56 w-56 -rotate-6 flex-col items-center justify-center space-y-4 rounded-lg border border-gray-300 bg-white p-4 shadow-lg lg:flex">
            <KeyIcon className="h-16 w-16 text-green-500" />
            <p className="text-3xl font-bold">Key Vault</p>
          </div>
          <div className="absolute -bottom-16 right-0 z-10 flex h-56 w-56 rotate-3 flex-col items-center justify-center space-y-4 rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
            <ChatBubbleBottomCenterTextIcon className="h-16 w-16 text-green-500" />
            <p className="text-3xl font-bold">Streaming</p>
          </div>
        </div>
      </div>
    ),
    highlight: "bg-green-700",
  },
  {
    id: "data-collection",
    title: "Data Collection",
    icon: <CircleStackIcon className="h-6 w-6 text-orange-500" />,
    content: (
      <div className="my-2 grid h-full w-full grid-cols-8 gap-0 bg-orange-300 p-8 md:my-8 md:rounded-lg md:p-16">
        <div className="relative col-span-8 hidden w-full items-center justify-center md:col-span-5 md:flex">
          <Image
            className="absolute -left-16 z-20 max-h-[40rem] w-full -rotate-2 rounded-lg border border-gray-300 object-contain shadow-lg lg:col-span-1"
            src="/assets/home/bento/logs.webp"
            alt="requests"
            width={980}
            height={900}
          />
        </div>
        <div className="col-span-8 flex flex-col space-y-4 text-black md:col-span-3">
          <h2 className="text-3xl font-bold tracking-tight">Data Collection</h2>
          <p className="text-md font-medium text-gray-700">
            Collect, normalize, and transform data from various providers and
            models
          </p>
          <Link
            href="/signup"
            className="w-fit rounded-lg border border-black bg-orange-400 px-4 py-2 text-sm font-bold hover:bg-orange-500"
          >
            Start Collecting Data
          </Link>
          <ul className="text-md grid w-fit grid-cols-1 gap-4 pt-6 font-bold">
            <li className="flex items-center gap-2">
              <TableCellsIcon className="h-6 w-6" /> Request Logs
            </li>
            <li className="flex items-center gap-2">
              <RectangleGroupIcon className="h-6 w-6" /> Create Datasets
            </li>
            <li className="flex items-center gap-2">
              <InboxStackIcon className="h-6 w-6" /> Standardized schemas
            </li>
            <li className="flex items-center gap-2">
              <CodeBracketIcon className="h-6 w-6" /> REST API
            </li>
          </ul>
        </div>
      </div>
    ),
    highlight: "bg-orange-700",
  },
  {
    id: "fine-tuning",
    title: "Fine-Tuning",
    icon: <CodeBracketSquareIcon className="h-6 w-6 text-red-500" />,
    content: (
      <div className="my-2 grid h-full w-full grid-cols-8 gap-0 bg-red-500 p-8 md:my-8 md:rounded-lg md:p-16">
        <div className="col-span-8 flex flex-col space-y-4 text-white md:col-span-3">
          <h2 className="text-3xl font-bold tracking-tight">Fine-Tuning</h2>
          <p className="text-md font-medium">
            Easily fine-tune on your datasets to improve quality while cutting
            costs.
          </p>
          <Link
            href="/signup"
            className="w-fit rounded-lg border border-white bg-red-600 px-4 py-2 text-sm font-bold hover:bg-red-500"
          >
            Start Fine-tuning
          </Link>
        </div>
        <div className="relative col-span-8 hidden w-full items-center justify-center md:col-span-5 md:flex">
          <Image
            className="absolute -top-8 z-20 max-h-[27rem] w-fit -rotate-2 rounded-lg border border-gray-300 object-contain shadow-lg lg:col-span-1"
            src="/assets/home/bento/finetune.webp"
            alt="requests"
            width={980}
            height={604}
          />
          <Image
            className="absolute -bottom-16 right-0 z-20 max-h-72 w-fit rotate-3 rounded-lg border border-gray-300 object-contain shadow-lg lg:col-span-1"
            src="/assets/home/bento/create-finetune.webp"
            alt="requests"
            width={980}
            height={604}
          />
        </div>
      </div>
    ),
    highlight: "bg-red-700",
  },
  {
    id: "evaluations",
    title: "Evaluations",
    icon: <BeakerIcon className="h-6 w-6 text-black" />,
    content: (
      <div className="my-2 grid h-full w-full grid-cols-8 gap-0 bg-black p-8 md:my-8 md:rounded-lg md:p-16">
        <div className="col-span-8 flex flex-col space-y-4 text-white md:col-span-3">
          <h2 className="text-3xl font-bold tracking-tight">Evaluations</h2>
          <p className="text-md font-medium">
            Evaluate your models, datasets, and more with our evaluation tools
          </p>
          <Link
            href="/contact"
            className="w-fit rounded-lg border border-white px-4 py-2 text-sm font-bold hover:bg-gray-900"
          >
            Join Beta
          </Link>
          <ul className="text-md grid w-fit grid-cols-1 gap-4 pt-4 font-bold">
            <li className="flex items-center gap-2">
              <DocumentTextIcon className="h-6 w-6" /> Prompt Testing
            </li>
            <li className="flex items-center gap-2">
              <TableCellsIcon className="h-6 w-6" /> Model Evaluations
            </li>
            <li className="flex items-center gap-2">
              <BellAlertIcon className="h-6 w-6" /> More to come...
            </li>
          </ul>
        </div>
        <div className="relative col-span-8 hidden w-full items-center justify-center md:col-span-5 md:flex">
          <Image
            className="absolute bottom-0 z-20 max-h-72 w-fit rotate-2 rounded-lg border border-gray-300 object-contain shadow-lg lg:col-span-1"
            src="/assets/home/bento/template.webp"
            alt="requests"
            width={980}
            height={700}
          />
          <div className="absolute -right-8 -top-8 z-30 flex h-56 w-56 -rotate-3 flex-col items-center justify-center space-y-4 rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
            <HandThumbUpIcon className="h-16 w-16 text-black" />
            <p className="text-3xl font-bold">Feedback</p>
          </div>
        </div>
      </div>
    ),
    highlight: "bg-black",
  },
  {
    id: "customer-portal",
    title: "Customer Portal",
    icon: <UserGroupIcon className="h-6 w-6 text-sky-500" />,
    content: (
      <div className="my-2 grid h-full w-full grid-cols-8 gap-8 overflow-hidden bg-sky-500 p-8 md:my-8 md:rounded-lg md:p-16">
        <div className="relative col-span-8 hidden w-full items-center justify-center md:col-span-5 md:flex">
          <Image
            className="absolute -bottom-24 -left-8 z-20 max-h-96 w-fit rounded-lg border border-gray-300 object-contain shadow-lg lg:col-span-1"
            src="/assets/home/bento/portal.webp"
            alt="requests"
            width={980}
            height={604}
          />
        </div>
        <div className="relative col-span-8 flex flex-col space-y-4 text-white md:col-span-3">
          <h2 className="text-3xl font-bold tracking-tight">Customer Portal</h2>
          <p className="text-md font-medium">
            Share Helicone dashboards and insights with your customers
          </p>
          <Link
            href="/features/customer-portal"
            className="w-fit rounded-lg border border-white px-4 py-2 text-sm font-bold hover:bg-gray-900"
          >
            Explore
          </Link>
          <ul className="text-md grid w-fit grid-cols-1 gap-4 pt-6 font-bold">
            <li className="flex items-center gap-2">
              <CodeBracketSquareIcon className="h-6 w-6" /> White Labeling
            </li>
            <li className="flex items-center gap-2">
              <RectangleGroupIcon className="h-6 w-6" /> Create Datasets
            </li>
            <li className="flex items-center gap-2">
              <InboxStackIcon className="h-6 w-6" /> Standardized schemas
            </li>
            <li className="flex items-center gap-2">
              <CodeBracketIcon className="h-6 w-6" /> REST API
            </li>
          </ul>
        </div>
      </div>
    ),
    highlight: "bg-sky-700",
  },
];

const Features = (props: FeaturesProps) => {
  const {} = props;

  const [activeTab, setActiveTab] = useState(tabOptions[0].id);

  return (
    <div className="flex w-full flex-col">
      <div className="flex w-full md:hidden">
        <AccordionList className="w-full">
          {tabOptions.map((tab, idx) => (
            <Accordion key={idx}>
              <AccordionHeader className="text-sm font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                <div className="flex items-center gap-4">
                  {tab.icon}
                  <span className="font-bold">{tab.title}</span>
                </div>
              </AccordionHeader>
              <AccordionBody className="">{tab.content}</AccordionBody>
            </Accordion>
          ))}
        </AccordionList>
      </div>
      <div className="mx-auto hidden w-full flex-col justify-center md:flex">
        <div className="mx-auto flex w-full flex-col justify-center px-10">
          <ul className="mx-auto flex w-full flex-wrap items-center justify-center gap-4 border-b border-gray-300 lg:gap-6">
            {tabOptions.map((tab) => (
              <li key={tab.id} className="relative">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    // tab.id === activeTab ? `border-b-4 ${tab.highlight}` : "",
                    "flex items-center gap-2 p-3 transition-all duration-300 ease-in-out",
                  )}
                >
                  <span
                    className={clsx(tab.id !== activeTab ? `opacity-40` : "")}
                  >
                    {tab.icon}
                  </span>
                  <p className="text-md font-bold">{tab.title}</p>
                </button>
                {tab.id === activeTab && (
                  <div
                    className={`absolute -m-0.5 h-1 w-full ${tab.highlight}`}
                  >
                    {" "}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex h-full w-full items-center gap-2">
          <button
            onClick={() => {
              const idx = tabOptions.findIndex((tab) => tab.id === activeTab);
              if (idx === 0) {
                setActiveTab(tabOptions[tabOptions.length - 1].id);
              } else {
                setActiveTab(tabOptions[idx - 1].id);
              }
            }}
            className="rounded-full border border-gray-300 p-2"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <div className="h-full w-full sm:h-[28rem]">
            {tabOptions.find((tab) => tab.id === activeTab)?.content}
          </div>
          <button
            onClick={() => {
              const idx = tabOptions.findIndex((tab) => tab.id === activeTab);
              if (idx === tabOptions.length - 1) {
                setActiveTab(tabOptions[0].id);
              } else {
                setActiveTab(tabOptions[idx + 1].id);
              }
            }}
            className="rounded-full border border-gray-300 p-2"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Features;
