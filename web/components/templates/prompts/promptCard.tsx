import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { usePrompt } from "../../../services/hooks/prompts/prompts";
import HcBadge from "../../ui/hcBadge";
import { AreaChart } from "@tremor/react";

interface PromptCardProps {
  prompt: {
    id: string;
    user_defined_id: string;
    description: string;
    pretty_name: string;
    major_version: number;
  };
}

const PromptCard = (props: PromptCardProps) => {
  const { prompt } = props;

  const { prompt: promptInfo, isLoading, refetch } = usePrompt(prompt.id);

  return (
    <div className="bg-white w-full h-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-black p-4 flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <DocumentTextIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        <h3 className="text-2xl font-semibold text-black dark:text-white">
          {promptInfo?.user_defined_id}
        </h3>
      </div>
      <p className="text-sm text-gray-500">
        Last Used:{" "}
        {new Date(promptInfo?.created_at || "").toLocaleString("en-US")}
      </p>
      <AreaChart
        className="h-36 py-8"
        data={[
          {
            date: "Jan 22",
            SemiAnalysis: 2890,
            "The Pragmatic Engineer": 2338,
          },
          {
            date: "Feb 22",
            SemiAnalysis: 2756,
            "The Pragmatic Engineer": 2103,
          },
          {
            date: "Mar 22",
            SemiAnalysis: 3322,
            "The Pragmatic Engineer": 2194,
          },
          {
            date: "Apr 22",
            SemiAnalysis: 3470,
            "The Pragmatic Engineer": 2108,
          },
          {
            date: "May 22",
            SemiAnalysis: 3475,
            "The Pragmatic Engineer": 1812,
          },
          {
            date: "Jun 22",
            SemiAnalysis: 3129,
            "The Pragmatic Engineer": 1726,
          },
          {
            date: "Jul 22",
            SemiAnalysis: 3490,
            "The Pragmatic Engineer": 1982,
          },
          {
            date: "Aug 22",
            SemiAnalysis: 2903,
            "The Pragmatic Engineer": 2012,
          },
          {
            date: "Sep 22",
            SemiAnalysis: 2643,
            "The Pragmatic Engineer": 2342,
          },
          {
            date: "Oct 22",
            SemiAnalysis: 2837,
            "The Pragmatic Engineer": 2473,
          },
          {
            date: "Nov 22",
            SemiAnalysis: 2954,
            "The Pragmatic Engineer": 3848,
          },
          {
            date: "Dec 22",
            SemiAnalysis: 3239,
            "The Pragmatic Engineer": 3736,
          },
        ]}
        index="date"
        categories={["SemiAnalysis", "The Pragmatic Engineer"]}
        colors={["indigo", "rose"]}
        // valueFormatter={dataFormatter}
        showYAxis={false}
        showXAxis={false}
        showLegend={false}
        showGridLines={false}
        yAxisWidth={60}
        showTooltip={false}
        onValueChange={(v) => console.log(v)}
      />

      <div className="flex flex-wrap items-center space-x-2">
        <HcBadge
          title={`${promptInfo?.major_version} major versions`}
          size={"sm"}
        />
        <HcBadge
          title={`${promptInfo?.versions.length} versions`}
          size={"sm"}
        />
      </div>
      <p className="text-sm text-gray-500">
        Created:{" "}
        {new Date(promptInfo?.created_at || "").toLocaleString("en-US")}
      </p>
    </div>
  );
};

export default PromptCard;
