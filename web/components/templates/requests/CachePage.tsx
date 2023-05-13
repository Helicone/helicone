import { ArrowPathIcon, TvIcon } from "@heroicons/react/24/outline";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import {
  ColumnOrderState,
  ColumnSizingState,
  createColumnHelper,
} from "@tanstack/react-table";
import { useRouter } from "next/router";
import Papa from "papaparse";

import { useEffect, useState } from "react";
import { HeliconeRequest } from "../../../lib/api/request/request";
import { Result } from "../../../lib/result";
import { middleTruncString, truncString } from "../../../lib/stringHelpers";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useDebounce } from "../../../services/hooks/debounce";
import { useGetKeys } from "../../../services/hooks/keys";
import { useLayouts } from "../../../services/hooks/useLayouts";
import { FilterNode, parseKey } from "../../../services/lib/filters/filterDefs";
import {
  SortDirection,
  SortLeafRequest,
} from "../../../services/lib/sorts/requests/sorts";
import { Database, Json } from "../../../supabase/database.types";
import AuthHeader from "../../shared/authHeader";
import { clsx } from "../../shared/clsx";
import LoadingAnimation from "../../shared/loadingAnimation";
import useNotification from "../../shared/notification/useNotification";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import ThemedTableHeader, {
  escapeCSVString,
} from "../../shared/themed/themedTableHeader";
import ThemedTableV3 from "./requestTable";
import {
  capitalizeWords,
  getUSDate,
  removeLeadingWhitespace,
} from "../../shared/utils/utils";
import { Column } from "../../ThemedTableV2";
import { Filters } from "../dashboard/filters";
import RequestDrawer from "./requestDrawer";
import useRequestsPage, {
  convertRequest,
  RequestWrapper,
} from "./useRequestsPage";
import RequestTable from "./requestTable";
import { Col } from "../../shared/layout/col";
import { Row } from "../../shared/layout/row";
import { useQuery } from "@tanstack/react-query";
import Metric from "../../shared/themed/themedMetric";
import {
  useCachePageMetrics,
  useCachePageOverTime,
  useCachePageTopMetrics,
  useCachePageTopRequests,
} from "../../../services/hooks/useCachePage";
import { BsCashCoin, BsHourglass } from "react-icons/bs";
import { BoltIcon } from "@heroicons/react/20/solid";
import { Grid } from "../../shared/layout/grid";
import { ThemedMiniTable } from "../../shared/themed/themedMiniTable";
import { RenderLineChart } from "../dashboard/timeGraph";
import { ThemedMetricList } from "../../shared/themed/themedMetricList";
import ThemedPieChart from "../cache/modelPIeChart";
import { MultilineRenderLineChart } from "../cache/timeGraph";

interface CachePropProps {}

type useCachePageRet = ReturnType<typeof useCachePageMetrics>;

const baseMetricUIData = {
  isLoading: (x: useCachePageRet[keyof useCachePageRet]) => x.isLoading,
  color: "bg-blue-500",
  className: "text-white",
  icon: <TvIcon className="w-8 h-8" />,
};

const metricsUIData: {
  [key in keyof useCachePageRet]: {
    title: string;
    value: (x: useCachePageRet[key]) => any;
    color: string;
    className: string;
    icon: React.ReactNode;
    isLoading: (x: useCachePageRet[key]) => boolean;
  };
} = {
  totalCached: {
    ...baseMetricUIData,
    title: "Total Cached",
    value: (x) => x.data?.data ?? 0,
    icon: <BoltIcon className="w-8 h-8" />,
  },
  totalSavings: {
    ...baseMetricUIData,
    title: "Total Savings",
    value: (x) => (x.data?.data ? Math.ceil(x.data.data * 100) / 100 : 0),
    icon: <BsCashCoin className="w-8 h-8" />,
  },
  avgSecondsSaved: {
    ...baseMetricUIData,
    title: "Time Saved(s)",
    value: (x) => x.data?.data ?? 0,
    icon: <BsHourglass className="w-8 h-8" />,
  },
};

const CachePage = (props: CachePropProps) => {
  const data = useCachePageMetrics();
  const topMetrics = useCachePageTopMetrics();
  const topRequests = useCachePageTopRequests();
  const modelCacheOverTime = useCachePageOverTime();
  const router = useRouter();

  return (
    <Col className="w-full items-center ">
      <Col className="max-w-3xl gap-10 w-full">
        <div className="w-full bg-white rounded-md p-5">
          <p>Learn how to use caching</p>
          <p>
            {"->"}
            <a
              className="text-blue-500"
              href="https://docs.helicone.ai/advanced-usage/caching"
            >
              Docs
            </a>
          </p>
        </div>
        <Grid className="w-full items-center grid-cols-3 gap-3">
          {Object.entries(metricsUIData).map(([key, value]) => (
            <Metric
              key={key}
              title={value.title}
              value={value.value(data[key as keyof useCachePageRet])}
              color={value.color}
              className="bg-white col-span-1"
              icon={value.icon}
              isLoading={value.isLoading(data[key as keyof useCachePageRet])}
            />
          ))}
        </Grid>
        <Grid className="w-full items-center grid-cols-2 gap-3">
          <div className="h-full bg-white rounded-md">
            <ThemedPieChart
              data={
                topMetrics.topModels.data?.data?.map((x) => ({
                  name: x.model,
                  value: +x.count,
                })) ?? []
              }
              isLoading={topMetrics.topModels.isLoading}
            />
          </div>
          <ThemedMetricList
            header="Top Users"
            values={
              topMetrics.topUsers.data?.data?.map((x) => ({
                title: x.user_id,
                value: "" + x.count,
              })) ?? []
            }
            isLoading={topMetrics.topModels.isLoading}
          />
        </Grid>

        <MultilineRenderLineChart
          data={modelCacheOverTime.overTime.data?.data ?? []}
          timeMap={(x) => new Date(x).toISOString()}
          valueFormatter={(x) => `${x}`}
          className="h-64 w-full bg-white p-5 pb-2 rounded-md"
        />

        <ThemedMiniTable
          className={{
            header: "items-center text-center font-semibold text-md h-12",
            td: clsx(
              "text-xs h-10 text-left pl-10 w-10 ",
              topRequests.topRequests.isLoading ? "animate-pulse" : ""
            ),
            tr: "hover:bg-slate-100 cursor-pointer",
          }}
          columns={[
            { key: "count", hidden: false, name: "Count" },
            { key: "prompt", hidden: false, name: "Request" },
            { key: "first", hidden: false, name: "First Request" },
            { key: "last", hidden: false, name: "Last Used" },
          ]}
          rows={
            topRequests.topRequests?.data?.data?.map((value) => ({
              count: {
                data: `${value.count}`,
              },
              prompt: {
                data: `${middleTruncString(value.prompt, 50)}`,
              },
              first: {
                data: `${new Date(value.first_used).toLocaleString()}`,
              },
              last: {
                data: `${value.last_used}`,
              },
            })) ?? []
          }
          onRowClick={(x, i) => {
            router.push(
              `/requests?requestId=${topRequests.topRequests?.data?.data?.[i].request_id}`
            );
          }}
          isLoading={topRequests.topRequests.isLoading}
          header="Top Requests"
        />
      </Col>
    </Col>
  );
};

export default CachePage;
