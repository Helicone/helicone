import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AuthLayout from "../components/shared/layout/authLayout";
import BasePageV2 from "../components/shared/layout/basePageV2";
import LoadingAnimation from "../components/shared/loadingAnimation";
import MetaData from "../components/shared/metaData";
import HomePage from "../components/templates/home/homePage";
import { DEMO_EMAIL } from "../lib/constants";
import { redirectIfLoggedIn } from "../lib/redirectIdLoggedIn";
import { Octokit } from "@octokit/core";
import { HeliconeIssuesResolvedType } from "./api/issues";
import { useQuery } from "@tanstack/react-query";

interface HomeProps {}

const Home = (props: HomeProps) => {
  const {} = props;
  const router = useRouter();

  const user = useUser();

  const { isLoading, data } = useQuery({
    queryKey: ["issues"],
    queryFn: async () => {
      const response = await fetch("/api/issues");
      return (await response.json()) as HeliconeIssuesResolvedType;
    },
  });

  console.log(data);

  function getLabel(label: HeliconeIssuesResolvedType["data"][0]["labels"][0]) {
    if (typeof label === "string") {
      return label;
    }
    return label.name;
  }

  const activeIssues = data?.data.filter((issue) =>
    issue.labels.map((label) => getLabel(label)).includes("active")
  );
  const communityVotes = data?.data
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
        <div>
          <h1 className="text-3xl font-bold leading-9 text-gray-900 sm:text-4xl sm:leading-10 md:text-5xl md:leading-14">
            Roadmap
          </h1>
          <div>
            <h2 className="mt-3 text-xl leading-7 text-gray-500 sm:mt-4 sm:text-2xl sm:leading-9 md:text-3xl md:leading-9">
              Active Issues
            </h2>
            {activeIssues?.map((issue) => (
              <div key={issue.id + "_active"}>
                {issue.html_url}
                {issue.title} {issue.reactions?.["+1"]}
              </div>
            ))}
          </div>
          <div>
            <h2 className="mt-3 text-xl leading-7 text-gray-500 sm:mt-4 sm:text-2xl sm:leading-9 md:text-3xl md:leading-9">
              Community Votes {/* WE should rename this */}
            </h2>
          </div>
        </div>
        {communityVotes?.map((issue) => (
          <div key={issue.id + "_not_active"}>
            {issue.labels.map((label, i) => (
              <div key={i}>{getLabel(label)}</div>
            ))}
            {issue.html_url}
            {issue.title} {issue.reactions?.["+1"]}
          </div>
        ))}
      </BasePageV2>
    </MetaData>
  );
};

export default Home;
