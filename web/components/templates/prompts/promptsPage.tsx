import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { TextInput } from "@tremor/react";
import { usePrompts } from "../../../services/hooks/prompts/prompts";
import { useState } from "react";
import { clsx } from "../../shared/clsx";
import Link from "next/link";

interface PromptsPageProps {}

const PromptsPage = (props: PromptsPageProps) => {
  const {} = props;

  const { prompts } = usePrompts();
  const [currentPrompt, setCurrentPrompt] = useState<{
    id: string;
    latest_version: number;
  }>();

  return (
    <div className="flex flex-col space-y-4 w-full">
      <div className="flex flex-row items-center justify-between">
        <h1 className="font-semibold text-3xl text-black dark:text-white">
          Prompts
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
      <div className="flex flex-col space-y-4 w-full min-w-[350px] max-w-[350px]">
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

        <ul className="w-full bg-white h-fit border border-gray-300 dark:border-gray-700 rounded-lg">
          {prompts?.data?.map((prompt, i) => (
            <li key={i}>
              <Link
                href={`/prompts/${prompt.id}`}
                className={clsx(
                  currentPrompt?.id === prompt.id
                    ? "bg-sky-200 dark:bg-sky-800"
                    : "bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-950",
                  i === 0 ? "rounded-t-md" : "",
                  i === prompts.data?.length - 1 ? "rounded-b-md" : "",
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
                    <div className="text-gray-500">{prompt.latest_version}</div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PromptsPage;
