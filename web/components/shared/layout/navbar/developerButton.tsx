import { Popover, Transition } from "@headlessui/react";
import Image from "next/image";
import {
  ArrowPathIcon,
  BookOpenIcon,
  ChatBubbleBottomCenterIcon,
  ChevronDownIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  MapIcon,
  UserGroupIcon,
  UserIcon,
} from "@heroicons/react/20/solid";
import { ChartPieIcon, CircleStackIcon } from "@heroicons/react/20/solid";
import { Fragment } from "react";
import { clsx } from "../../clsx";
import Link from "next/link";

const solutions = [
  {
    name: "Custom Properties",
    href: "https://docs.helicone.ai/features/advanced-usage/custom-properties",
    icon: ChartPieIcon,
  },
  {
    name: "User Metrics",
    href: "https://docs.helicone.ai/features/advanced-usage/user-metrics",
    icon: UserGroupIcon,
  },
  {
    name: "Caching",
    href: "https://docs.helicone.ai/features/advanced-usage/caching",
    icon: CircleStackIcon,
  },
  {
    name: "Request Retries",
    href: "https://docs.helicone.ai/features/advanced-usage/retries",
    icon: ArrowPathIcon,
  },
  {
    name: "Rate Limiting",
    href: "https://docs.helicone.ai/features/advanced-usage/custom-rate-limits",
    icon: UserIcon,
  },
  {
    name: "Streaming",
    href: "https://docs.helicone.ai/features/streaming",
    icon: ChatBubbleBottomCenterIcon,
  },
  {
    name: "Webhooks",
    href: "https://docs.helicone.ai/features/webhooks",
    icon: GlobeAltIcon,
  },
  {
    name: "GraphQL",
    href: "https://docs.helicone.ai/graphql/getting-started",
    icon: CodeBracketIcon,
  },
];

export default function DeveloperButton() {
  return (
    <div className="">
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button
              className={clsx(
                "flex flex-row items-center font-semibold hover:bg-gray-200 rounded-lg px-4 py-2 focus:outline-none"
              )}
            >
              <span>Developer</span>
              <ChevronDownIcon
                className={`${open ? "" : "text-opacity-70"}
                  ml-1 h-5 w-5 transition duration-150 ease-in-out group-hover:text-opacity-80`}
                aria-hidden="true"
              />
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute z-10 mt-3 w-[400px] transform px-4 sm:px-0">
                <div className="overflow-hidden rounded-lg shadow-2xl ring-1 ring-black ring-opacity-10">
                  <div className="bg-gray-50 p-4">
                    <Link
                      href="https://docs.helicone.ai/introduction"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flow-root rounded-md px-2 py-2 transition duration-150 ease-in-out hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
                    >
                      <span className="flex items-center">
                        <BookOpenIcon className="flex-shrink-0 h-4 w-4 text-gray-900" />
                        <span className="text-sm font-semibold text-gray-900 ml-1.5">
                          View Documentation
                        </span>
                      </span>
                      <span className="block text-sm text-gray-500 mt-1">
                        Start integrating products and tools to your application
                      </span>
                    </Link>
                  </div>
                  <div className="relative grid gap-8 bg-white p-7 lg:grid-cols-2">
                    {solutions.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center text-white">
                          <item.icon
                            aria-hidden="true"
                            className="text-sky-500"
                          />
                        </div>
                        <div className="ml-1.5">
                          <p className="text-sm font-medium text-gray-900">
                            {item.name}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="bg-gray-50 p-4 flex flex-row items-center">
                    <Link
                      href="https://github.com/Helicone/helicone"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flow-root w-full rounded-md px-2 py-2 transition duration-150 ease-in-out hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
                    >
                      <span className="flex items-center">
                        <Image
                          src="/assets/landing/github-mark.png"
                          className="text-gray-900"
                          width={16}
                          height={16}
                          alt="Github"
                        />
                        <span className="text-sm font-semibold text-gray-900 ml-1.5">
                          View Github
                        </span>
                      </span>
                    </Link>
                    <Link
                      href="/roadmap"
                      className="flow-root w-full rounded-md px-2 py-2 transition duration-150 ease-in-out hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
                    >
                      <span className="flex items-center">
                        <MapIcon className="flex-shrink-0 h-4 w-4 text-gray-900" />
                        <span className="text-sm font-semibold text-gray-900 ml-1.5">
                          View Roadmap
                        </span>
                      </span>
                    </Link>
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
}
