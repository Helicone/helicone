import {
  ArrowUpIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/router";
import AuthLayout from "../../shared/layout/authLayout";
import ThemedTable from "../../shared/themed/themedTable";
import { useEffect, useState } from "react";
import { Database } from "../../../supabase/database.types";
import { modelCost } from "../../../lib/api/metrics/costCalc";
import AuthHeader from "../../shared/authHeader";
import { useQuery } from "@tanstack/react-query";
import { ModelMetric } from "../../../lib/api/models/models";
import { Result } from "../../../lib/result";
import LoadingAnimation from "../../shared/loadingAnimation";

interface ModelPageProps {}

type ModelMetrics = Database["public"]["Views"]["model_metrics"]["Row"];

const ModelPage = (props: ModelPageProps) => {
  const client = useSupabaseClient<Database>();
  const { data, isLoading } = useQuery({
    queryKey: ["modelMetrics"],
    queryFn: async (query) => {
      return await fetch("/api/models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: "all",
          offset: 0,
          limit: 100,
        }),
      }).then((res) => res.json() as Promise<Result<ModelMetric[], string>>);
    },
    refetchOnWindowFocus: false,
  });

  console.log(data?.data);
  return (
    <>
      <AuthHeader title={"Models"} />
      {isLoading ? (
        <LoadingAnimation title="Getting model metrics" />
      ) : (
        <ThemedTable
          columns={[
            { name: "Model", key: "model", hidden: false },
            { name: "Requests", key: "total_requests", hidden: false },
            {
              name: "Prompt Tokens",
              key: "total_completion_tokens",
              hidden: false,
            },
            {
              name: "Completion Tokens",
              key: "total_prompt_token",
              hidden: false,
            },
            { name: "Total Tokens", key: "total_tokens", hidden: false },

            { name: "Cost (USD)", key: "cost", hidden: false },
          ]}
          rows={data?.data ?? []}
        />
      )}
    </>
  );
};

export default ModelPage;
