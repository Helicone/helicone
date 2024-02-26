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
} from "@heroicons/react/24/solid";
import Image from "next/image";
import { useState } from "react";
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
    icon: <ChartPieIcon className="w-6 h-6 text-violet-500" />,
    content: (
      <div className="my-2 md:my-8 w-full md:rounded-lg bg-violet-500 h-full grid grid-cols-8 p-8 gap-8 md:p-16">
        <div className="flex flex-col space-y-4 text-white col-span-8 md:col-span-3">
          <h2 className="text-3xl font-bold tracking-tight">Monitoring</h2>
          <p className="text-md font-medium max-w-xs text-gray-300">
            Understand how your application is performing with our monitoring
            tools
          </p>
          <Link
            className="border border-white font-bold py-2 px-4 text-sm rounded-lg w-fit bg-violet-500 hover:bg-violet-500"
            href={"/signup"}
          >
            Start Monitoring
          </Link>
          <ul className="gap-4 md:gap-6 font-bold text-md grid grid-cols-2 w-fit pt-4">
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
        <div className="hidden md:flex relative col-span-8 md:col-span-5 w-full justify-center items-center">
          <Image
            className="block z-20 absolute -bottom-4 shadow-lg rounded-lg border border-gray-300 max-h-72 w-fit object-contain lg:col-span-1"
            src="/assets/home/bento/requests.webp"
            alt="requests"
            width={980}
            height={604}
          />
          <Image
            className="block absolute z-10 rotate-12 top-0 right-0 shadow-lg rounded-lg border border-gray-300 col-span-2 max-h-64 w-fit object-contain lg:col-span-1"
            src="/assets/home/bento/users.webp"
            alt="users"
            width={980}
            height={604}
          />
          <Image
            className="block absolute top-0 -rotate-6 left-0 shadow-lg rounded-lg border border-gray-300 col-span-2 max-h-64 w-fit object-contain lg:col-span-1"
            src="/assets/home/bento/costs.webp"
            alt="costs"
            width={908}
            height={608}
          />
        </div>
      </div>
    ),
    highlight: "ring-violet-700 bg-violet-100",
  },
  {
    id: "gateway",
    title: "Gateway",
    icon: <ArrowPathIcon className="w-6 h-6 text-green-500" />,
    content: (
      <div className="my-2 md:my-8 w-full md:rounded-lg bg-green-300 h-full grid grid-cols-8 p-8 gap-8 md:p-16">
        <div className="flex flex-col space-y-4 text-black w-full col-span-8">
          <h2 className="text-3xl font-bold tracking-tight">Gateway</h2>
          <p className="text-md font-medium">
            Within our proxy, we offer caching, rate limiting, prompt detection,
            key vault, and much more...
          </p>
          <Link
            href="/signup"
            className="border border-black font-bold py-2 px-4 text-sm rounded-lg w-fit bg-green-400 hover:bg-green-500"
          >
            Get integrated in minutes
          </Link>
        </div>
        <div className="z-20 hidden md:flex relative col-span-8 w-full object-contain justify-center items-center">
          <div className="shadow-lg bg-white border border-gray-300 rounded-lg h-56 w-56 p-4 justify-center items-center flex flex-col space-y-4 absolute left-0 -bottom-16 -rotate-3">
            <CircleStackIcon className="w-16 h-16 text-green-500" />
            <p className="text-3xl font-bold">Caching</p>
          </div>
          <div className="z-30 shadow-lg bg-white border border-gray-300 rounded-lg h-56 w-56 p-4 justify-center items-center hidden lg:flex flex-col space-y-4 absolute left-48 -bottom-16 rotate-6">
            <StopCircleIcon className="w-16 h-16 text-green-500" />
            <p className="text-3xl font-bold">Rate Limiting</p>
          </div>
          <div className="z-50 shadow-lg bg-white border border-gray-300 rounded-lg h-56 w-56 p-4 justify-center items-center flex flex-col space-y-4 absolute -bottom-16">
            <ShieldCheckIcon className="w-16 h-16 text-green-500" />
            <p className="text-3xl font-bold text-center">Prompt Detection</p>
          </div>
          <div className="z-40 shadow-lg bg-white border border-gray-300 rounded-lg h-56 w-56 p-4 justify-center items-center hidden lg:flex flex-col space-y-4 absolute right-48 -bottom-16 -rotate-6">
            <KeyIcon className="w-16 h-16 text-green-500" />
            <p className="text-3xl font-bold">Key Vault</p>
          </div>
          <div className="z-10 shadow-lg bg-white border border-gray-300 rounded-lg h-56 w-56 p-4 justify-center items-center flex flex-col space-y-4 absolute right-0 -bottom-16 rotate-3">
            <ChatBubbleBottomCenterTextIcon className="w-16 h-16 text-green-500" />
            <p className="text-3xl font-bold">Streaming</p>
          </div>
        </div>
      </div>
    ),
    highlight: "ring-green-700 bg-green-100",
  },
  {
    id: "data-collection",
    title: "Data Collection",
    icon: <CircleStackIcon className="w-6 h-6 text-orange-500" />,
    content: (
      <div className="my-2 md:my-8 w-full md:rounded-lg bg-orange-300 h-full grid grid-cols-8 p-8 gap-0 md:p-16">
        <div className="hidden md:flex relative col-span-8 md:col-span-5 w-full justify-center items-center">
          <Image
            className="z-20 absolute -left-16 shadow-lg rounded-lg border border-gray-300 max-h-[40rem] -rotate-2 w-full object-contain lg:col-span-1"
            src="/assets/home/bento/logs.png"
            alt="requests"
            width={980}
            height={900}
          />
        </div>
        <div className="flex flex-col space-y-4 text-black col-span-8 md:col-span-3">
          <h2 className="text-3xl font-bold tracking-tight">Data Collection</h2>
          <p className="text-md font-medium text-gray-700">
            Collect, normalize, and transform data from various providers and
            models
          </p>
          <Link
            href="/signup"
            className="border border-black font-bold py-2 px-4 text-sm rounded-lg w-fit bg-orange-400 hover:bg-orange-500"
          >
            Start Collecting Data
          </Link>
          <ul className="gap-4 font-bold text-md grid grid-cols-1 w-fit pt-6">
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
              <CodeBracketIcon className="h-6 w-6" /> GraphQL API
            </li>
          </ul>
        </div>
      </div>
    ),
    highlight: "ring-orange-700 bg-orange-100",
  },
  {
    id: "fine-tuning",
    title: "Fine-Tuning",
    icon: <CodeBracketSquareIcon className="w-6 h-6 text-red-500" />,
    content: (
      <div className="my-2 md:my-8 w-full md:rounded-lg bg-red-500 h-full grid grid-cols-8 p-8 gap-0 md:p-16">
        <div className="flex flex-col space-y-4 text-white col-span-8 md:col-span-3">
          <h2 className="text-3xl font-bold tracking-tight">Fine-Tuning</h2>
          <p className="text-md font-medium">
            Easily fine-tune on your datasets to improve quality while cutting
            costs.
          </p>
          <Link
            href="/signup"
            className="border border-white font-bold py-2 px-4 text-sm rounded-lg w-fit bg-red-600 hover:bg-red-500"
          >
            Start Fine-tuning
          </Link>
        </div>
        <div className="hidden md:flex relative col-span-8 md:col-span-5 w-full justify-center items-center">
          <Image
            className="z-20 absolute -top-8 shadow-lg rounded-lg border border-gray-300 max-h-[27rem] -rotate-2 w-fit object-contain lg:col-span-1"
            src="/assets/home/bento/finetune.png"
            alt="requests"
            width={980}
            height={604}
          />
          <Image
            className="z-20 absolute -bottom-16 right-0 shadow-lg rounded-lg border border-gray-300 max-h-72 rotate-3 w-fit object-contain lg:col-span-1"
            src="/assets/home/bento/create-finetune.png"
            alt="requests"
            width={980}
            height={604}
          />
        </div>
      </div>
    ),
    highlight: "ring-red-700 bg-red-100",
  },
  {
    id: "evaluations",
    title: "Evaluations",
    icon: <BeakerIcon className="w-6 h-6 text-black" />,
    content: (
      <div className="my-2 md:my-8 w-full md:rounded-lg bg-black h-full grid grid-cols-8 p-8 gap-0 md:p-16">
        <div className="flex flex-col space-y-4 text-white col-span-8 md:col-span-3">
          <h2 className="text-3xl font-bold tracking-tight">Evaluations</h2>
          <p className="text-md font-medium">
            Evaluate your models, datasets, and more with our evaluation tools
          </p>
          <Link
            href="/contact"
            className="border border-white font-bold py-2 px-4 text-sm rounded-lg w-fit  hover:bg-gray-900"
          >
            Join Beta
          </Link>
          <ul className="gap-4 font-bold text-md grid grid-cols-1 w-fit pt-4">
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
        <div className="hidden md:flex relative col-span-8 md:col-span-5 w-full justify-center items-center">
          <Image
            className="z-20 absolute bottom-0 shadow-lg rounded-lg border border-gray-300 max-h-72 rotate-2 w-fit object-contain lg:col-span-1"
            src="/assets/home/bento/template.png"
            alt="requests"
            width={980}
            height={700}
          />
          <div className="z-30 shadow-lg bg-white -top-8 -right-8 border border-gray-300 rounded-lg h-56 w-56 p-4 justify-center items-center flex flex-col space-y-4 absolute -rotate-3">
            <HandThumbUpIcon className="w-16 h-16 text-black" />
            <p className="text-3xl font-bold">Feedback</p>
          </div>
        </div>
      </div>
    ),
    highlight: "ring-black bg-gray-100",
  },
  {
    id: "customer-portal",
    title: "Customer Portal",
    icon: <UserGroupIcon className="w-6 h-6 text-sky-500" />,
    content: (
      <div className="my-2 md:my-8 w-full md:rounded-lg bg-sky-500 h-full grid grid-cols-8 p-8 gap-8 md:p-16 overflow-hidden">
        <div className="hidden md:flex relative col-span-8 md:col-span-5 w-full justify-center items-center">
          <Image
            className="z-20 absolute -bottom-24 -left-8 shadow-lg rounded-lg border border-gray-300 max-h-96 w-fit object-contain lg:col-span-1"
            src="/assets/home/bento/portal.png"
            alt="requests"
            width={980}
            height={604}
          />
        </div>
        <div className="flex flex-col space-y-4 text-white col-span-8 md:col-span-3 relative">
          <h2 className="text-3xl font-bold tracking-tight">Customer Portal</h2>
          <p className="text-md font-medium">
            Share Helicone dashboards and insights with your customers
          </p>
          <Link
            href="/features/customer-portal"
            className="border border-white font-bold py-2 px-4 text-sm rounded-lg w-fit  hover:bg-gray-900"
          >
            Explore
          </Link>
          <ul className="gap-4 font-bold text-md grid grid-cols-1 w-fit pt-6">
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
              <CodeBracketIcon className="h-6 w-6" /> GraphQL API
            </li>
          </ul>
        </div>
      </div>
    ),
    highlight: "ring-sky-700 bg-sky-100",
  },
];

const Features = (props: FeaturesProps) => {
  const {} = props;

  const [activeTab, setActiveTab] = useState(tabOptions[0].id);

  return (
    <div className="flex flex-col w-full">
      <div className="flex md:hidden w-full">
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
      <div className="hidden md:flex flex-col w-full justify-center mx-auto">
        <ul className="w-full flex flex-wrap items-center gap-8 lg:gap-8 mx-auto justify-center">
          {tabOptions.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  tab.id === activeTab
                    ? `ring-2 ${tab.highlight}`
                    : "ring-1  ring-gray-300",
                  "flex items-center p-3 rounded-lg gap-2 transition-all duration-300 ease-in-out"
                )}
              >
                <span className="">{tab.icon}</span>
                <p className="text-md font-bold">{tab.title}</p>
              </button>
            </li>
          ))}
        </ul>
        {
          <div className="w-full h-full sm:h-[28rem]">
            {tabOptions.find((tab) => tab.id === activeTab)?.content}
          </div>
        }
      </div>
    </div>
  );
};

export default Features;
