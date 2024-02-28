import {
  BookOpenIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { TextInput } from "@tremor/react";
import { usePrompts } from "../../../services/hooks/prompts/prompts";
import { useState } from "react";
import { clsx } from "../../shared/clsx";
import Link from "next/link";
import { useOrg } from "../../layout/organizationContext";
import { CreatePromptDataSetModal } from "../datasets/createPromptDataset";

interface PromptsPageProps {}

const PromptsPage = (props: PromptsPageProps) => {
  const {} = props;

  const { prompts } = usePrompts();
  const [currentPrompt, setCurrentPrompt] = useState<{
    id: string;
    latest_version: number;
  }>();

  const org = useOrg();
  const [openCreatePromptDataSetModal, setOpenCreatePromptDataSetModal] =
    useState(false);

  return (
    <div className="flex flex-col space-y-4 w-full">
      <div className="flex flex-row items-center justify-between">
        <h1 className="font-semibold text-3xl text-black dark:text-white">
          Prompts
          {prompts?.data?.isOverLimit && (
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
          )}
        </h1>

        {/* <Link
          href="https://docs.helicone.ai/features/advanced-usage/caching"
          target="_blank"
          rel="noreferrer noopener"
          className="w-fit flex items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <BookOpenIcon className="h-4 w-4" />
        </Link> */}
      </div>

      <div className="flex flex-col space-y-4 w-full">
        <TextInput
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
        />
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
                      : "bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-950",
                    i === 0 ? "rounded-t-md" : "",
                    i === prompts.data?.prompts.length - 1
                      ? "rounded-b-md"
                      : "",
                    "w-full flex flex-col space-x-2 p-2 border-b border-gray-200 dark:border-gray-800"
                  )}
                >
                  {/* <TagIcon className="h-4 w-4 text-black dark:text-white" /> */}
                  <p className="text-md font-semibold text-black dark:text-white p-2">
                    {prompt.id}
                  </p>
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
        <h1 className="font-semibold text-3xl text-black dark:text-white">
          Datasets
        </h1>
        <button
          onClick={() => {
            setOpenCreatePromptDataSetModal(true);
          }}
          className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg w-fit"
        >
          Create Dataset
        </button>

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
                      : "bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-950",
                    i === 0 ? "rounded-t-md" : "",
                    i === prompts.data?.prompts.length - 1
                      ? "rounded-b-md"
                      : "",
                    "w-full flex flex-col space-x-2 p-2 border-b border-gray-200 dark:border-gray-800"
                  )}
                >
                  {/* <TagIcon className="h-4 w-4 text-black dark:text-white" /> */}
                  <p className="text-md font-semibold text-black dark:text-white p-2">
                    {prompt.id}
                  </p>
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
      <CreatePromptDataSetModal
        open={openCreatePromptDataSetModal}
        setOpen={setOpenCreatePromptDataSetModal}
      />
    </div>
  );
};

export default PromptsPage;
