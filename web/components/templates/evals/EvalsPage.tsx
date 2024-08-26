import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "../../layout/organizationContext";
import { getJawnClient } from "../../../lib/clients/jawn";
import AuthHeader from "../../shared/authHeader";

import { BarChart, Card } from "@tremor/react";
import LoadingAnimation from "../../shared/loadingAnimation";
import Link from "next/link";
import { ChartBarIcon, PlusIcon } from "@heroicons/react/24/outline";

const EvalsPage = () => {
  const org = useOrg();
  const [selectedEval, setSelectedEval] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["evals", org?.currentOrg?.id],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      return jawn.POST("/v1/evals/query", {
        body: {
          filter: "all",
        },
      });
    },
    refetchOnWindowFocus: false,
  });

  const evals = data?.data?.data || [];

  const columns = [
    { name: "Eval Name", key: "name" },
    { name: "Average Score", key: "averageScore" },
    { name: "Min Score", key: "minScore" },
    { name: "Max Score", key: "maxScore" },
    { name: "Count", key: "count" },
  ];

  if (isLoading) {
    return <LoadingAnimation />;
  }

  if (evals.length === 0) {
    return (
      <>
        <AuthHeader title="Evals" />
        <div className="flex flex-col w-full mt-12 justify-center items-center">
          <div className="flex flex-col items-center max-w-3xl">
            <ChartBarIcon className="h-12 w-12 text-black dark:text-white" />
            <p className="text-xl text-black dark:text-white font-semibold mt-6">
              No Evals
            </p>
            <p className="text-sm text-gray-500 max-w-sm mt-2 text-center">
              Start adding evals to your requests to see them here.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href="https://docs.helicone.ai/features/advanced-usage/evals"
                className="w-fit items-center rounded-md bg-black px-3 py-2 gap-2 text-sm flex font-medium text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                View Docs
              </Link>
              <Link
                href="/requests"
                className="w-fit items-center rounded-md bg-blue-600 px-3 py-2 gap-2 text-sm flex font-medium text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <PlusIcon className="h-4 w-4" />
                Add Evals
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthHeader title="Evals" />
      <div className="space-y-4">
        <Card>
          <h2 className="text-xl font-semibold mb-4">Evals Overview</h2>
        </Card>
        {selectedEval && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">
              {selectedEval} Details
            </h2>
            <BarChart
              data={
                evals.find((e) => e.name === selectedEval)?.distribution || []
              }
              index="range"
              categories={["count"]}
              colors={["blue"]}
              yAxisWidth={48}
            />
          </Card>
        )}
      </div>
    </>
  );
};

export default EvalsPage;
