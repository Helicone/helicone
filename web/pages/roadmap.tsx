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
  return (
    <MetaData title="Home">
      <BasePageV2>
        {data?.data
          .filter((issue) =>
            issue.labels.find((label) => {
              if (typeof label === "string") {
                return label === "roadmap";
              }
              return label.name === "roadmap";
            })
          )
          .map((issue) => (
            <div key={issue.id}>
              {issue.html_url}
              {issue.title} {issue.reactions?.["+1"]}
            </div>
          ))}
      </BasePageV2>
    </MetaData>
  );
};

export default Home;
