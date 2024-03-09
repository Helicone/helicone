import { Menu, Transition } from "@headlessui/react";
import {
  ArrowTrendingUpIcon,
  BeakerIcon,
  BookOpenIcon,
  DocumentTextIcon,
  EyeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@tremor/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ElementType, Fragment, useState } from "react";
import { useExperiments } from "../../../services/hooks/prompts/experiments";
import { usePrompts } from "../../../services/hooks/prompts/prompts";
import { useOrg } from "../../layout/organizationContext";
import { clsx } from "../../shared/clsx";

interface PromptsPageProps {
  defaultIndex: number;
}

const tabs: {
  id: number;
  title: string;
  icon: ElementType<any>;
}[] = [
  {
    id: 0,
    title: "Prompts",
    icon: DocumentTextIcon,
  },
  {
    id: 1,
    title: "Experiments",
    icon: BeakerIcon,
  },
  {
    id: 2,
    title: "Evaluations",
    icon: ArrowTrendingUpIcon,
  },
];

const PromptsPage = (props: PromptsPageProps) => {
  const { defaultIndex } = props;

  const { prompts } = usePrompts();
  const { experiments } = useExperiments();
  const [currentPrompt, setCurrentPrompt] = useState<{
    id: string;
    latest_version: number;
  }>();

  const org = useOrg();
  const router = useRouter();

  return (
    <div className="flex flex-col space-y-4 w-full">
      <h1 className="font-semibold text-3xl text-black dark:text-white">
        Prompts (Beta)
      </h1>
      <TabGroup defaultIndex={defaultIndex}>
        <TabList className="font-semibold" variant="line">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              icon={tab.icon}
              onClick={() => {
                router.push(
                  {
                    query: { tab: tab.id },
                  },
                  undefined,
                  { shallow: true }
                );
              }}
            >
              {tab.title}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          <TabPanel>
            {prompts?.data?.isOverLimit && (
              <div className="flex flex-row items-center justify-between py-2">
                <h1 className="font-semibold text-3xl text-black dark:text-white">
                  <p className="text-green-500 text-sm">
                    You have reached the limit of prompts{" "}
                    <a
                      href={
                        org?.currentOrg?.tier === "free"
                          ? "/settings?tab=1"
                          : "https://cal.com/team/helicone/helicone-discovery"
                      }
                      className="text-blue-500 underline"
                    >
                      upgrade to{" "}
                      {org?.currentOrg?.tier === "free" ? "pro" : "enterprise"}
                    </a>{" "}
                    get more prompts
                  </p>
                </h1>
              </div>
            )}
            <div className="flex flex-col space-y-4 w-full py-2">
              {/* <TextInput
                icon={MagnifyingGlassIcon}
                placeholder="Search Prompt Id..."
                className="max-w-sm"
                onChange={(e) => {
                  // // add this into query params as search
                  // const search = e.target.value as string;
                  // setCurrentSearch(search);
                  // if (search === "") {
                  //   // delete the query param from the url
                  //   delete router.query.q;
                  //   router.push({
                  //     pathname: router.pathname,
                  //     query: { ...router.query },
                  //   });
                  //   refetch();
                  //   return;
                  // }
                  // router.push({
                  //   pathname: router.pathname,
                  //   query: { ...router.query, q: search },
                  // });
                  // refetch();
                }}
              /> */}
              {prompts?.data?.prompts.length === 0 ? (
                <div className="flex flex-col w-full h-96 justify-center items-center">
                  <div className="flex flex-col">
                    <DocumentTextIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                    <p className="text-xl text-black dark:text-white font-semibold mt-8">
                      No Prompts
                    </p>
                    <p className="text-sm text-gray-500 max-w-sm mt-2">
                      View our documentation to learn how to create a prompt.
                    </p>
                    <div className="mt-4">
                      <Link
                        href="https://docs.helicone.ai/features/prompts/intro"
                        className="w-fit items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <BookOpenIcon className="h-4 w-4" />
                        View Docs
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <ul className="w-full h-full grid grid-cols-4 gap-4">
                  {prompts?.data?.prompts.map((prompt, i) => (
                    <li
                      key={i}
                      className="col-span-1 bg-white border border-gray-300 dark:border-gray-700 rounded-lg"
                    >
                      <Link
                        href={`/prompts/${prompt.id}`}
                        className={clsx(
                          currentPrompt?.id === prompt.id
                            ? "bg-sky-200 dark:bg-sky-800"
                            : "bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-950 rounded-md p-2",
                          i === 0 ? "rounded-t-md" : "",
                          i === prompts.data?.prompts.length - 1
                            ? "rounded-b-md"
                            : "",
                          "w-full flex flex-col space-x-2"
                        )}
                      >
                        {/* <TagIcon className="h-4 w-4 text-black dark:text-white" /> */}
                        <div className="flex items-start w-full justify-between relative">
                          <p className="text-md font-semibold text-black dark:text-white p-2">
                            {prompt.id}
                          </p>
                          <Menu as="div" className="relative text-left pl-1">
                            <div className="flex items-center">
                              <Menu.Button
                                className="absolute top-1 right-0"
                                onClick={(e: any) => {
                                  e.stopPropagation();
                                }}
                              >
                                <EllipsisVerticalIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                              </Menu.Button>
                            </div>
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="z-50 absolute right-0 mt-8 w-24 origin-top-right divide-y divide-gray-100 dark:divide-gray-900 rounded-md bg-white dark:bg-black shadow-lg ring-1 ring-black dark:ring-gray-500 ring-opacity-5 focus:outline-none">
                                <div className="px-1 py-1">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        className={`${
                                          active
                                            ? "bg-sky-500 text-white dark:text-black"
                                            : "text-gray-900 dark:text-gray-100"
                                        } group flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs`}
                                        onClick={() => {
                                          setCurrentPrompt({
                                            id: prompt.id,
                                            latest_version:
                                              prompt.latest_version,
                                          });
                                        }}
                                      >
                                        <EyeIcon
                                          className="h-4 w-4"
                                          aria-hidden="true"
                                        />
                                        View
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        className={`${
                                          active
                                            ? "bg-sky-500 text-white dark:text-black"
                                            : "text-gray-900 dark:text-gray-100"
                                        } group flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs`}
                                        onClick={() => {
                                          // TODO: implement
                                        }}
                                      >
                                        <TrashIcon
                                          className="h-4 w-4"
                                          aria-hidden="true"
                                        />
                                        Delete
                                      </button>
                                    )}
                                  </Menu.Item>
                                </div>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        </div>

                        <div className="flex flex-row justify-between w-full pr-2">
                          <div className="text-gray-500 text-xs">
                            {new Date(prompt.created_at).toLocaleString()}
                          </div>

                          <div className="flex flex-row items-center space-x-1 text-xs">
                            <div className="text-gray-500">Versions:</div>
                            <div className="text-gray-500">
                              {prompt.latest_version}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabPanel>
          <TabPanel>
            <div className="w-full h-full grid grid-cols-4 gap-4 py-2">
              {experiments?.map((experiment, i) => (
                <div
                  key={i}
                  className="col-span-1 bg-white border border-gray-300 dark:border-gray-700 rounded-lg"
                >
                  <Link
                    href={`/prompts/experiments/${experiment.id}`}
                    className={clsx(
                      "bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-950 rounded-md p-2",
                      i === 0 ? "rounded-t-md" : "",
                      "w-full flex flex-col space-x-2"
                    )}
                  >
                    <div className="flex items-start w-full justify-between relative">
                      <p className="text-md font-semibold text-black dark:text-white p-2">
                        {experiment.name}
                      </p>
                    </div>

                    <div className="flex flex-row justify-between w-full pr-2">
                      <div className="text-gray-500 text-xs">
                        {new Date(experiment.created_at).toLocaleString()}
                      </div>

                      <div className="flex flex-row items-center space-x-1 text-xs">
                        <div className="text-gray-500">Status:</div>
                        <div className="text-gray-500">{experiment.status}</div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </TabPanel>
          <TabPanel>
            <div className="flex flex-col w-full h-96 justify-center items-center">
              <div className="flex flex-col w-2/5">
                <ArrowTrendingUpIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                <p className="text-xl text-black dark:text-white font-semibold mt-8">
                  Evaluations is an enterprise feature
                </p>
                <p className="text-sm text-gray-500 max-w-sm mt-2">
                  Please reach out to us at{" "}
                  <Link
                    href="mailto:sales@helicone.ai"
                    className="underline text-blue-500"
                  >
                    sales@helicone.ai
                  </Link>{" "}
                  to get access to this feature.
                </p>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default PromptsPage;
