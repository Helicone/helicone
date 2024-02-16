import {
  ArrowPathIcon,
  BeakerIcon,
  ChartPieIcon,
  CircleStackIcon,
  CodeBracketSquareIcon,
  UserGroupIcon,
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
        <div className="flex flex-col space-y-8 text-white">
          <h2 className="text-3xl font-bold tracking-tight">Monitoring</h2>
          <ul className="list-disc text-xl pl-4 space-y-2 font-bold">
            <li>Dashboards</li>
            <li>Logs</li>
            <li>Alerts</li>
            <li>User Insights</li>
          </ul>
        </div>
        <Image
          className="z-20 absolute bottom-8 right-32 shadow-sm rounded-lg border border-gray-300 max-h-72 w-fit object-contain lg:col-span-1"
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
    content: "Data Collection",
    highlightColor: "border-green-700",
  },
  {
    id: "data-collection",
    title: "Data Collection",
    icon: <CircleStackIcon className="w-6 h-6 text-orange-500" />,
    content: (
      <div className="my-8 w-full rounded-lg bg-orange-300 h-[28rem] relative p-16 flex justify-end">
        <div className="flex flex-col space-y-4 text-black w-2/5">
          <h2 className="text-3xl font-bold tracking-tight">Data Collection</h2>
          <p className="text-xl font-bold">
            Normalize and collect data from various providers and models
          </p>
          <ul className="list-disc text-xl pl-4 space-y-2 font-bold">
            <li>OpenAI</li>
            <li>Anthropic</li>
            <li>Gemini</li>
            <li>and many more...</li>
          </ul>
        </div>
        <Image
          className="z-20 absolute bottom-4 left-8 shadow-sm rounded-lg border border-gray-300 max-h-[27rem] -rotate-2 w-fit object-contain lg:col-span-1"
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
    content: "Fine-Tuning",
    highlightColor: "border-red-700",
  },
  {
    id: "evaluations",
    title: "Evaluations",
    icon: <BeakerIcon className="w-6 h-6 text-black" />,
    content: "Evaluations",
    highlightColor: "border-black",
  },
  {
    id: "customer-portal",
    title: "Customer Portal",
    icon: <UserGroupIcon className="w-6 h-6 text-sky-500" />,
    content: "Customer Portal",
    highlightColor: "border-sky-700",
  },
];

const Features = (props: FeaturesProps) => {
  const {} = props;

  const [activeTab, setActiveTab] = useState(tabOptions[0].id);

  return (
    <div className="flex flex-col w-full">
      <div className="border-b border-gray-300 w-full flex justify-center gap-16 mx-auto">
        <ul className="w-fit flex items-center gap-16">
          {tabOptions.map((tab) => (
            <li
              key={tab.id}
              className={clsx(
                tab.id === activeTab && `border-b-[3px] ${tab.highlightColor}`,
                "flex items-center pb-3 -mb-0.5"
              )}
            >
              <button
                onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center gap-2"
              >
                {tab.icon}
                <p className="text-md font-bold">{tab.title}</p>
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
