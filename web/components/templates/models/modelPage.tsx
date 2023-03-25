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

interface ModelPageProps {}

type ModelMetrics = Database["public"]["Views"]["model_metrics"]["Row"];

const ModelPage = (props: ModelPageProps) => {
  const client = useSupabaseClient<Database>();
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics[]>([]);

  useEffect(() => {
    client
      .from("model_metrics")
      .select("*")

      .then(({ data: metrics, error }) => {
        if (error !== null) {
          console.error(error);
          return;
        }
        setModelMetrics(metrics);
      });
  }, [client]);

  return (
    <>
      <AuthHeader title={"Models"} />
      <ThemedTable
        columns={[
          { name: "Model", key: "model", hidden: false },
          { name: "Requests", key: "request_count", hidden: false },
          { name: "Prompt Tokens", key: "sum_prompt_tokens", hidden: false },
          {
            name: "Completion Tokens",
            key: "sum_completion_tokens",
            hidden: false,
          },
          { name: "Total Tokens", key: "sum_tokens", hidden: false },

          { name: "Cost (USD)", key: "cost", hidden: false },
        ]}
        rows={modelMetrics
          .filter((m) => m.model !== null)
          .map((m) => ({
            ...m,
            cost: modelCost(m as any).toFixed(2),
          }))}
      />
    </>
  );
};

export default ModelPage;
