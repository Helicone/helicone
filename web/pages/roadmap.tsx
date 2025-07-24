import { StarIcon } from "@heroicons/react/20/solid";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import BasePageV2 from "../components/layout/basePageV2";
import LoadingAnimation from "../components/shared/loadingAnimation";
import MetaData from "../components/layout/public/authMetaData";
import { HeliconeIssuesResolvedType } from "./api/issues";

const Home = () => {
  const { isLoading, data } = useQuery({
    queryKey: ["issues"],
    queryFn: async () => {
      const response = await fetch("/api/issues");
      return (await response.json()) as HeliconeIssuesResolvedType;
    },
  });

  function getLabel(label: HeliconeIssuesResolvedType["data"][0]["labels"][0]) {
    if (typeof label === "string") {
      return label;
    }
    return label.name;
  }

  const issues = data?.data
    .filter((issue) =>
      issue.labels.map((label) => getLabel(label)).includes("active"),
    )
    .sort((a, b) => {
      if (
        a.reactions?.["+1"] === undefined ||
        b.reactions?.["+1"] === undefined
      ) {
        return 0;
      }
      if (a.reactions?.["+1"] > b.reactions?.["+1"]) {
        return -1;
      }
      if (a.reactions?.["+1"] < b.reactions?.["+1"]) {
        return 1;
      }
      return 0;
    });
  const activeIssues = issues?.filter((issue) => issue.state === "open");
  const finishedIssues = issues?.filter((issue) => issue.state === "closed");

  const communityVotes = data?.data
    .filter((issue) => issue.state === "open")
    .filter(
      (issue) =>
        !issue.labels.map((label) => getLabel(label)).includes("active") &&
        issue.labels.map((label) => getLabel(label)).includes("roadmap"),
    )
    .sort((a, b) => {
      if (
        a.reactions?.["+1"] === undefined ||
        b.reactions?.["+1"] === undefined
      ) {
        return 0;
      }
      if (a.reactions?.["+1"] > b.reactions?.["+1"]) {
        return -1;
      }
      if (a.reactions?.["+1"] < b.reactions?.["+1"]) {
        return 1;
      }
      return 0;
    });

  return (
    <MetaData title="Home">
      <BasePageV2>
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between border-l border-r border-dashed border-gray-300 p-6 md:justify-start md:space-x-10 lg:px-8">
          <div className="max-w-3xl space-y-16 py-16">
            <div className="flex flex-col space-y-4">
              <p className="font-sans text-5xl">Roadmap</p>
              <p className="font-sans text-lg">
                We are building a community-driven roadmap. View and vote on
                issues that you would like to see implemented in Helicone.
              </p>
              <p className="font-sans text-lg">
                Have an idea for a feature? Create an issue on our{" "}
                <Link
                  href="https://github.com/Helicone/helicone/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Github
                </Link>{" "}
                or discuss it on our{" "}
                <Link
                  href="https://discord.gg/zsSTcH2qhG"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Discord
                </Link>
                .
              </p>
            </div>
            {isLoading ? (
              <LoadingAnimation title="Loading Roadmap..." />
            ) : (
              <div className="flex flex-col space-y-16">
                <div className="flex w-full flex-col">
                  <h2 className="mb-4 mt-3 text-xl leading-7 text-gray-900 sm:mt-4 sm:text-2xl sm:leading-9 md:text-3xl md:leading-9">
                    Active Issues
                  </h2>
                  <div className="divide-y-gray-200 divide-y">
                    {activeIssues?.map((issue) => (
                      <Link
                        href={issue.html_url}
                        key={issue.id + "_active"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-row items-center justify-between px-4 py-3 hover:bg-gray-100"
                      >
                        <div>
                          <p className="text-md font-semibold text-gray-900">
                            {issue.title}
                          </p>
                          <div className="flex flex-row items-center space-x-1 text-xs text-gray-500">
                            <p className="max-w-[16rem] truncate overflow-ellipsis sm:max-w-[24rem] md:max-w-[32rem] lg:max-w-[40rem]">
                              {issue.body}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-row items-center space-x-2">
                          <StarIcon className="h-5 text-yellow-300" />
                          {issue.reactions?.["+1"]}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="mb-4 mt-3 text-xl leading-7 text-gray-900 sm:mt-4 sm:text-2xl sm:leading-9 md:text-3xl md:leading-9">
                    Backlog
                  </h2>
                  <div className="divide-y-gray-200 divide-y">
                    {communityVotes?.map((issue) => (
                      <Link
                        href={issue.html_url}
                        key={issue.id + "_not_active"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-row items-center justify-between px-4 py-3 hover:bg-gray-100"
                      >
                        <div>
                          <p className="text-md font-semibold text-gray-900">
                            {issue.title}
                          </p>
                          <div className="flex flex-row items-center space-x-1 text-xs text-gray-500">
                            <p className="max-w-[16rem] truncate overflow-ellipsis sm:max-w-[24rem] md:max-w-[32rem] lg:max-w-[40rem]">
                              {issue.body}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-row items-center space-x-2">
                          <StarIcon className="h-4 text-yellow-300" />
                          {issue.reactions?.["+1"]}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="mb-4 mt-3 text-xl leading-7 text-gray-900 sm:mt-4 sm:text-2xl sm:leading-9 md:text-3xl md:leading-9">
                    Finished Issues
                  </h2>
                  <div className="divide-y-gray-200 divide-y">
                    {finishedIssues?.map((issue) => (
                      <Link
                        href={issue.html_url}
                        key={issue.id + "_finished"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-row items-center justify-between px-4 py-3 hover:bg-gray-100"
                      >
                        <div>
                          <p className="text-md font-semibold text-gray-900">
                            {issue.title}
                          </p>
                          <div className="flex flex-row items-center space-x-1 text-xs text-gray-500">
                            <p className="max-w-[16rem] truncate overflow-ellipsis sm:max-w-[24rem] md:max-w-[32rem] lg:max-w-[40rem]">
                              {issue.body}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-row items-center space-x-2">
                          <StarIcon className="h-4 text-yellow-300" />
                          {issue.reactions?.["+1"]}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </BasePageV2>
    </MetaData>
  );
};

export default Home;
