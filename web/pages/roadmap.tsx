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
      issue.labels.map((label) => getLabel(label)).includes("active")
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
        issue.labels.map((label) => getLabel(label)).includes("roadmap")
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
        <div className="mx-auto border-r border-l border-gray-300 border-dashed flex w-full max-w-7xl items-center justify-between p-6 md:justify-start md:space-x-10 lg:px-8">
          <div className="py-16 max-w-3xl space-y-16">
            <div className="flex flex-col space-y-4">
              <p className="text-5xl font-sans">Roadmap</p>
              <p className="text-lg font-sans">
                We are building a community-driven roadmap. View and vote on
                issues that you would like to see implemented in Helicone.
              </p>
              <p className="text-lg font-sans">
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
                <div className="w-full flex flex-col">
                  <h2 className="mt-3 text-xl leading-7 text-gray-900 sm:mt-4 sm:text-2xl sm:leading-9 md:text-3xl md:leading-9 mb-4">
                    Active Issues
                  </h2>
                  <div className="divide-y divide-y-gray-200">
                    {activeIssues?.map((issue) => (
                      <Link
                        href={issue.html_url}
                        key={issue.id + "_active"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-row justify-between py-3 px-4 items-center hover:bg-gray-100"
                      >
                        <div>
                          <p className="text-md text-gray-900 font-semibold">
                            {issue.title}
                          </p>
                          <div className="text-xs text-gray-500 flex flex-row items-center space-x-1">
                            <p className="truncate overflow-ellipsis max-w-[16rem] sm:max-w-[24rem] md:max-w-[32rem] lg:max-w-[40rem]">
                              {issue.body}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-row items-center space-x-2 ">
                          <StarIcon className="text-yellow-300 h-5" />
                          {issue.reactions?.["+1"]}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="mt-3 text-xl leading-7 text-gray-900 sm:mt-4 sm:text-2xl sm:leading-9 md:text-3xl md:leading-9 mb-4">
                    Backlog
                  </h2>
                  <div className="divide-y divide-y-gray-200">
                    {communityVotes?.map((issue) => (
                      <Link
                        href={issue.html_url}
                        key={issue.id + "_not_active"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-row justify-between py-3 px-4 items-center hover:bg-gray-100"
                      >
                        <div>
                          <p className="text-md text-gray-900 font-semibold">
                            {issue.title}
                          </p>
                          <div className="text-xs text-gray-500 flex flex-row items-center space-x-1">
                            <p className="truncate overflow-ellipsis max-w-[16rem] sm:max-w-[24rem] md:max-w-[32rem] lg:max-w-[40rem]">
                              {issue.body}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-row items-center space-x-2">
                          <StarIcon className="text-yellow-300 h-4" />
                          {issue.reactions?.["+1"]}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="mt-3 text-xl leading-7 text-gray-900 sm:mt-4 sm:text-2xl sm:leading-9 md:text-3xl md:leading-9 mb-4">
                    Finished Issues
                  </h2>
                  <div className="divide-y divide-y-gray-200">
                    {finishedIssues?.map((issue) => (
                      <Link
                        href={issue.html_url}
                        key={issue.id + "_finished"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-row justify-between py-3 px-4 items-center hover:bg-gray-100"
                      >
                        <div>
                          <p className="text-md text-gray-900 font-semibold">
                            {issue.title}
                          </p>
                          <div className="text-xs text-gray-500 flex flex-row items-center space-x-1">
                            <p className="truncate overflow-ellipsis max-w-[16rem] sm:max-w-[24rem] md:max-w-[32rem] lg:max-w-[40rem]">
                              {issue.body}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-row items-center space-x-2">
                          <StarIcon className="text-yellow-300 h-4" />
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
