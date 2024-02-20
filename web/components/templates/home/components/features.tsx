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

interface FeaturesProps {}

const tabOptions: {
  id: string;
  title: string;
  icon: React.ReactNode;
  highlightColor: string;
  content: React.ReactNode;
}[] = [
  {
    id: "monitoring",
    title: "Monitoring",
    icon: <ChartPieIcon className="w-6 h-6 text-violet-700" />,
    content: (
      <div className="my-8 w-full rounded-lg bg-violet-600 h-[28rem] relative p-16">
        <div className="flex flex-col space-y-4 text-white">
          <h2 className="text-3xl font-bold tracking-tight">Monitoring</h2>
          <p className="text-md font-medium max-w-xs text-gray-300">
            Understand how your application is performing with our monitoring
            tools
          </p>
          <button className="border border-white font-bold py-2 px-4 text-sm rounded-lg w-fit bg-violet-500 hover:bg-violet-500">
            Get Started
          </button>
          <ul className="gap-6 font-bold text-md grid grid-cols-2 w-fit pt-4">
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
        <Image
          className="hidden md:block z-20 absolute bottom-8 right-32 shadow-sm rounded-lg border border-gray-300 max-h-72 w-fit object-contain lg:col-span-1"
          src="/assets/home/bento/requests.webp"
          alt="requests"
          width={980}
          height={604}
        />
        <Image
          className="hidden md:block absolute z-10 rotate-12 top-16 right-0 shadow-sm rounded-lg border border-gray-300 col-span-2 max-h-64 w-fit object-contain lg:col-span-1"
          src="/assets/home/bento/users.webp"
          alt="users"
          width={980}
          height={604}
        />
        <Image
          className="hidden md:block absolute top-8 -rotate-6 right-72 shadow-sm rounded-lg border border-gray-300 col-span-2 max-h-64 w-fit object-contain lg:col-span-1"
          src="/assets/home/bento/costs.webp"
          alt="costs"
          width={908}
          height={608}
        />
      </div>
    ),
    highlightColor: "border-violet-700",
  },
  {
    id: "gateway",
    title: "Gateway",
    icon: <ArrowPathIcon className="w-6 h-6 text-green-500" />,
    content: (
      <div className="my-8 w-full rounded-lg bg-green-300 h-[28rem] relative p-16 flex justify-end">
        <div className="flex flex-col space-y-4 text-black w-full">
          <h2 className="text-3xl font-bold tracking-tight">Gateway</h2>
          <p className="text-md font-medium">
            Within our proxy, we offer caching, rate limiting, prompt detection,
            key vault, and much more...
          </p>
          <button className="border border-black font-bold py-2 px-4 text-sm rounded-lg w-fit bg-green-400 hover:bg-green-500">
            Learn More
          </button>
        </div>
        <div className="shadow-md bg-white border border-gray-300 rounded-lg h-56 w-56 p-4 justify-center items-center flex flex-col space-y-4 absolute left-0 -bottom-4 -rotate-3">
          <CircleStackIcon className="w-16 h-16 text-green-500" />
          <p className="text-3xl font-bold">Caching</p>
        </div>
        <div className="shadow-md bg-white border border-gray-300 rounded-lg h-56 w-56 p-4 justify-center items-center flex flex-col space-y-4 absolute left-56 -bottom-4 rotate-6">
          <StopCircleIcon className="w-16 h-16 text-green-500" />
          <p className="text-3xl font-bold">Rate Limiting</p>
        </div>
        <div className="shadow-md bg-white border border-gray-300 rounded-lg h-56 w-56 p-4 justify-center items-center flex flex-col space-y-4 absolute left-[28rem] -bottom-4">
          <ShieldCheckIcon className="w-16 h-16 text-green-500" />
          <p className="text-3xl font-bold text-center">Prompt Detection</p>
        </div>
        <div className="shadow-md bg-white border border-gray-300 rounded-lg h-56 w-56 p-4 justify-center items-center flex flex-col space-y-4 absolute right-56 -bottom-4 -rotate-6">
          <KeyIcon className="w-16 h-16 text-green-500" />
          <p className="text-3xl font-bold">Key Vault</p>
        </div>
        <div className="shadow-md bg-white border border-gray-300 rounded-lg h-56 w-56 p-4 justify-center items-center flex flex-col space-y-4 absolute right-0 -bottom-4 rotate-3">
          <ChatBubbleBottomCenterTextIcon className="w-16 h-16 text-green-500" />
          <p className="text-3xl font-bold">Streaming</p>
        </div>
      </div>
    ),
    highlightColor: "border-green-700",
  },
  {
    id: "data-collection",
    title: "Data Collection",
    icon: <CircleStackIcon className="w-6 h-6 text-orange-500" />,
    content: (
      <div className="my-8 w-full rounded-lg bg-orange-300 h-[28rem] relative p-16 flex justify-end">
        <div className="flex flex-col space-y-4 text-black w-2/5 pl-4">
          <h2 className="text-3xl font-bold tracking-tight">Data Collection</h2>
          <p className="text-md font-medium text-gray-700">
            Collect, normalize, and transform data from various providers and
            models
          </p>
          <button className="border border-black font-bold py-2 px-4 text-sm rounded-lg w-fit bg-orange-400 hover:bg-orange-500">
            Get Started
          </button>
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
        <Image
          className="z-20 absolute bottom-0 left-4 shadow-sm rounded-lg border border-gray-300 max-h-[28rem] -rotate-2 w-fit object-contain lg:col-span-1"
          src="/assets/home/bento/logs.png"
          alt="requests"
          width={980}
          height={604}
        />
      </div>
    ),
    highlightColor: "border-orange-700",
  },
  {
    id: "fine-tuning",
    title: "Fine-Tuning",
    icon: <CodeBracketSquareIcon className="w-6 h-6 text-red-500" />,
    content: (
      <div className="my-8 w-full rounded-lg bg-red-500 h-[28rem] relative p-16 flex justify-start">
        <div className="flex flex-col space-y-4 text-white w-2/5">
          <h2 className="text-3xl font-bold tracking-tight">Fine-Tuning</h2>
          <p className="text-md font-medium">
            Easily fine-tune on your datasets to improve quality while cutting
            costs.
          </p>
          <button className="border border-white font-bold py-2 px-4 text-sm rounded-lg w-fit bg-red-600 hover:bg-red-500">
            Explore
          </button>
        </div>
        <Image
          className="z-20 absolute top-0 right-8 shadow-sm rounded-lg border border-gray-300 max-h-[27rem] -rotate-2 w-fit object-contain lg:col-span-1"
          src="/assets/home/bento/finetune.png"
          alt="requests"
          width={980}
          height={604}
        />
        <Image
          className="z-20 absolute -bottom-4 -right-4 shadow-sm rounded-lg border border-gray-300 max-h-72 rotate-3 w-fit object-contain lg:col-span-1"
          src="/assets/home/bento/create-finetune.png"
          alt="requests"
          width={980}
          height={604}
        />
      </div>
    ),
    highlightColor: "border-red-700",
  },
  {
    id: "evaluations",
    title: "Evaluations",
    icon: <BeakerIcon className="w-6 h-6 text-black" />,
    content: (
      <div className="my-8 w-full rounded-lg bg-black h-[28rem] relative p-16 flex justify-start">
        <div className="flex flex-col space-y-4 text-white w-2/5">
          <h2 className="text-3xl font-bold tracking-tight">Evaluations</h2>
          <p className="text-md font-medium">
            Evaluate your models, datasets, and more with our evaluation tools
          </p>
          <button className="border border-white font-bold py-2 px-4 text-sm rounded-lg w-fit  hover:bg-gray-900">
            Explore
          </button>
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
        <Image
          className="z-20 absolute bottom-0 right-0 shadow-sm rounded-lg border border-gray-300 max-h-60 rotate-2 w-fit object-contain lg:col-span-1"
          src="/assets/home/bento/template.png"
          alt="requests"
          width={980}
          height={604}
        />
        <div className="shadow-md bg-white border border-gray-300 rounded-lg h-56 w-56 p-4 justify-center items-center flex flex-col space-y-4 absolute top-0 right-0 -rotate-3">
          <HandThumbUpIcon className="w-16 h-16 text-black" />
          <p className="text-3xl font-bold">Feedback</p>
        </div>
      </div>
    ),
    highlightColor: "border-black",
  },
  {
    id: "customer-portal",
    title: "Customer Portal",
    icon: <UserGroupIcon className="w-6 h-6 text-sky-500" />,
    content: (
      <div className="my-8 w-full rounded-lg bg-sky-500 h-[28rem] relative p-16 flex justify-end overflow-hidden">
        <div className="flex flex-col space-y-4 text-white w-1/3 relative">
          <h2 className="text-3xl font-bold tracking-tight">Customer Portal</h2>
          <p className="text-md font-medium">
            Share Helicone dashboards and insights with your customers
          </p>
          <button className="border border-white font-bold py-2 px-4 text-sm rounded-lg w-fit  hover:bg-gray-900">
            Explore
          </button>
          <Image
            className="z-10 absolute -bottom-16 right-0 shadow-sm rounded-lg border border-gray-300 max-h-48 w-fit object-contain lg:col-span-1"
            src="/assets/home/bento/users.webp"
            alt="requests"
            width={980}
            height={604}
          />

          <Image
            className="z-30 absolute -bottom-28 right-0 shadow-sm rounded-lg border border-gray-300 max-h-48 w-fit object-contain lg:col-span-1"
            src="/assets/home/bento/requests.webp"
            alt="requests"
            width={980}
            height={604}
          />
        </div>
        <Image
          className="z-20 absolute -bottom-12 left-8 shadow-sm rounded-lg border border-gray-300 max-h-96 w-fit object-contain lg:col-span-1"
          src="/assets/home/bento/portal.png"
          alt="requests"
          width={980}
          height={604}
        />
      </div>
    ),
    highlightColor: "border-sky-700",
  },
];

const Features = (props: FeaturesProps) => {
  const {} = props;

  const [activeTab, setActiveTab] = useState(tabOptions[0].id);

  return (
    <div className="flex flex-col w-full">
      <div className="flex md:hidden">Hello</div>
      <div className="hidden md:flex border-b border-gray-300 w-full justify-center mx-auto">
        <ul className="w-fit flex items-center gap-8 lg:gap-16">
          {tabOptions.map((tab) => (
            <li
              key={tab.id}
              className={clsx(
                tab.id === activeTab && `border-b-[3px] ${tab.highlightColor}`,
                "flex items-center pb-4 -mb-0.5"
              )}
            >
              <button
                onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center gap-2"
              >
                {tab.icon}
                <p className="text-sm font-bold">{tab.title}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {
        <div className="w-full">
          {tabOptions.find((tab) => tab.id === activeTab)?.content}
        </div>
      }
    </div>
  );
};

export default Features;
