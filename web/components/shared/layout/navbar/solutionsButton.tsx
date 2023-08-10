import { Popover, Transition } from "@headlessui/react";
import {
  BugAntIcon,
  ChevronDownIcon,
  CodeBracketSquareIcon,
  DocumentMagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { ChartPieIcon, CircleStackIcon } from "@heroicons/react/20/solid";
import { Fragment } from "react";
import { clsx } from "../../clsx";
import Link from "next/link";

const solutions = [
  {
    name: "Data Segmentation",
    description: "Get insights into costs & behaviors.",
    href: "https://docs.helicone.ai/use-cases/segmentation",
    icon: ChartPieIcon,
    color: "text-sky-500",
  },
  {
    name: "Debugging",
    description: "Identify and rectify errors quickly.",
    href: "https://docs.helicone.ai/use-cases/debugging",
    icon: BugAntIcon,
    color: "text-pink-500",
  },
  {
    name: "Data ETL and Extraction",
    description: "Turn Helicone into a data warehouse.",
    href: "https://docs.helicone.ai/use-cases/etl",
    icon: CircleStackIcon,
    color: "text-violet-500",
  },
  {
    name: "Internal Auditing",
    description: "Ensure compliance and security.",
    href: "https://docs.helicone.ai/use-cases/data-autonomy",
    icon: DocumentMagnifyingGlassIcon,
    color: "text-amber-500",
  },
  {
    name: "Github Actions",
    description: "Automate and cache in your CI pipelines.",
    href: "https://docs.helicone.ai/use-cases/github-actions",
    icon: CodeBracketSquareIcon,
    color: "text-green-500",
  },
];

export default function SolutionsButton() {
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
              <span>Solutions</span>
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
                  <div className="relative grid gap-8 bg-white p-7 lg:grid-cols-1">
                    <p className="-mb-2 text-sm font-medium text-gray-700">
                      Use Cases
                    </p>
                    {solutions.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="-m-3 flex items-center rounded-lg p-2 transition duration-150 ease-in-out hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center text-white">
                          <item.icon
                            aria-hidden="true"
                            className={item.color}
                          />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="bg-gray-100 p-4">
                    <Link
                      href="/blog"
                      className="flow-root rounded-md px-2 py-2 transition duration-150 ease-in-out hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50"
                    >
                      <span className="flex items-center">
                        <span className="text-sm font-semibold text-gray-900">
                          Checkout our blog
                        </span>
                      </span>
                      <span className="block text-sm text-gray-500 mt-1">
                        Learn more about what is possible with our technology
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
