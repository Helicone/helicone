import {
  ArrowsPointingOutIcon,
  BookOpenIcon,
  BookmarkIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  PresentationChartLineIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  MultiSelect,
  MultiSelectItem,
  Select,
  SelectItem,
} from "@tremor/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  usePrompts,
  usePrompt,
} from "../../../../services/hooks/prompts/prompts";

import ThemedDrawer from "../../../shared/themed/themedDrawer";
import ThemedModal from "../../../shared/themed/themedModal";
import { Chat } from "../../requests/chat";
import { clsx } from "../../../shared/clsx";
import { Tooltip } from "@mui/material";
import { BeakerIcon } from "@heroicons/react/24/solid";
import { ThemedPill } from "../../../shared/themed/themedPill";
import ExperimentForm from "./experimentForm";
import PromptPropertyCard from "./promptPropertyCard";
import { useOrg } from "../../../layout/organizationContext";
import HcBreadcrumb from "../../../ui/hcBreadcrumb";
import HcBadge from "../../../ui/hcBadge";
import HcButton from "../../../ui/hcButton";
import { useRouter } from "next/router";
import ModelPill from "../../requestsV2/modelPill";
import ThemedTimeFilter from "../../../shared/themed/themedTimeFilter";
import { AreaChartUsageExample, DUMMY_DATA } from "./dummyChart";
import StyledAreaChart from "../../dashboard/styledAreaChart";
import { SimpleTable } from "../../../shared/table/simpleTable";
import TableFooter from "../../requestsV2/tableFooter";

interface PromptIdPageProps {
  id: string;
}

const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} days ago`;
  } else if (hours > 0) {
    return `${hours} hrs ago`;
  } else if (minutes > 0) {
    return `${minutes} min ago`;
  } else {
    return `${seconds} sec ago`;
  }
};

const PromptIdPage = (props: PromptIdPageProps) => {
  const { id } = props;
  const { prompt, isLoading } = usePrompt(id);

  const [experimentOpen, setExperimentOpen] = useState(false);

  const router = useRouter();

  return (
    <div className="w-full h-full flex flex-col space-y-8">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col items-start space-y-4 w-full">
          <HcBreadcrumb
            pages={[
              {
                href: "/prompts",
                name: "Prompts",
              },
              {
                href: `/prompts/${id}`,
                name: prompt?.user_defined_id || "Loading...",
              },
            ]}
          />
          <div className="flex justify-between w-full">
            <div className="flex gap-4 items-end">
              <h1 className="font-semibold text-4xl text-black dark:text-white">
                {prompt?.user_defined_id}
              </h1>
              <HcBadge
                title={`${(prompt?.major_version ?? 0) + 1} version${
                  (prompt?.major_version ?? 0) + 1 > 1 ? "s" : ""
                }`}
                size={"sm"}
              />
            </div>
            <div className="flex gap-2">
              <HcButton
                onClick={() => setExperimentOpen(!experimentOpen)}
                variant={"secondary"}
                size={"sm"}
                title="View Prompt"
                icon={BookOpenIcon}
              />
              <HcButton
                onClick={() => {
                  router.push(`/prompts/${id}/new-experiment`);
                }}
                variant={"primary"}
                size={"sm"}
                title="Start Experiment"
                icon={BeakerIcon}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <p className="">
              last used{" "}
              {prompt?.last_used && getTimeAgo(new Date(prompt?.last_used))}
            </p>
            {/* <div className="rounded-full h-1 w-1 bg-slate-400" />
            <ModelPill model={prompt?.latest_model_used || "unknown"} /> */}
            <div className="rounded-full h-1 w-1 bg-slate-400" />
            <p className="">
              created on{" "}
              {prompt?.created_at &&
                new Date(prompt?.created_at).toDateString()}
            </p>
          </div>
        </div>
      </div>
      <div className="w-full h-full flex flex-col space-y-4">
        <div className="flex items-center justify-between w-full">
          <ThemedTimeFilter
            timeFilterOptions={[
              {
                key: "24H",
                value: "24H",
              },
              {
                key: "7D",
                value: "7D",
              },
              {
                key: "1M",
                value: "1M",
              },
              {
                key: "3M",
                value: "3M",
              },
              {
                key: "all",
                value: "all",
              },
            ]}
            custom={true}
            onSelect={function (key: string, value: string): void {
              throw new Error("Function not implemented.");
            }}
            isFetching={false}
            defaultValue={"24H"}
            currentTimeFilter={{
              start: new Date(),
              end: new Date(),
            }}
          />
        </div>

        <div>
          <StyledAreaChart
            title={"Total Requests"}
            value={"1063"}
            isDataOverTimeLoading={false}
          >
            <AreaChartUsageExample />
          </StyledAreaChart>
        </div>
      </div>
      <div className="flex flex-col space-y-4 h-full w-full">
        <h2 className="text-2xl font-semibold">Experiment Logs</h2>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <MultiSelect placeholder="Version(s)">
              <MultiSelectItem value="1">Version 1</MultiSelectItem>
              <MultiSelectItem value="2">Version 2</MultiSelectItem>
              <MultiSelectItem value="3">Version 3</MultiSelectItem>
            </MultiSelect>{" "}
            <MultiSelect placeholder="Dataset">
              <MultiSelectItem value="1">Version 1</MultiSelectItem>
              <MultiSelectItem value="2">Version 2</MultiSelectItem>
              <MultiSelectItem value="3">Version 3</MultiSelectItem>
            </MultiSelect>{" "}
            <MultiSelect placeholder="Model">
              <MultiSelectItem value="1">Version 1</MultiSelectItem>
              <MultiSelectItem value="2">Version 2</MultiSelectItem>
              <MultiSelectItem value="3">Version 3</MultiSelectItem>
            </MultiSelect>
            <div className="pl-2">
              <HcButton variant={"light"} size={"sm"} title={"Clear All"} />
            </div>
          </div>
          <HcButton
            variant={"secondary"}
            size={"sm"}
            title={"Add Metrics"}
            icon={PresentationChartLineIcon}
          />
        </div>
        <SimpleTable
          data={DUMMY_DATA}
          columns={[
            {
              key: "name",
              header: "Name",
              render: (item) => item.name,
            },
            {
              key: "departement",
              header: "Departement",
              render: (item) => item.departement,
            },
            {
              key: "Role",
              header: "Role",
              render: (item) => item.Role,
            },
            {
              key: "status",
              header: "Status",
              render: (item) => item.status,
            },
          ]}
        />
        <TableFooter
          currentPage={0}
          pageSize={0}
          count={0}
          isCountLoading={false}
          onPageChange={function (newPageNumber: number): void {
            // throw new Error("Function not implemented.");
          }}
          onPageSizeChange={function (newPageSize: number): void {
            // throw new Error("Function not implemented.");
          }}
          pageSizeOptions={[]}
        />
      </div>
    </div>
  );
};

export default PromptIdPage;
