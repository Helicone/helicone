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
import { truncString } from "../../../lib/stringHelpers";
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
import { useCachePage } from "../../../services/hooks/useCachePage";
import { BsCashCoin, BsHourglass } from "react-icons/bs";
import { BoltIcon } from "@heroicons/react/20/solid";
import { Grid } from "../../shared/layout/grid";
import { ThemedMiniTable } from "../../shared/themed/themedMiniTable";

interface CachePropProps {}

type useCachePageRet = ReturnType<typeof useCachePage>;

const baseUIData = {
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
    ...baseUIData,
    title: "Total Cached",
    value: (x) => x.data?.data ?? 0,
    icon: <BoltIcon className="w-8 h-8" />,
  },
  totalSavings: {
    ...baseUIData,
    title: "Total Savings",
    value: (x) => x.data?.data ?? 0,
    icon: <BsCashCoin className="w-8 h-8" />,
  },
  avgSecondsSaved: {
    ...baseUIData,
    title: "Seconds Saved / Request",
    value: (x) => x.data?.data ?? 0,
    icon: <BsHourglass className="w-8 h-8" />,
  },
};

const CachePage = (props: CachePropProps) => {
  const data = useCachePage();
  return (
    <Col className="w-full items-center">
      <Grid className="w-full max-w-3xl items-center grid-cols-3 gap-3">
        {Object.entries(metricsUIData).map(([key, value]) => (
          <Metric
            key={key}
            title={value.title}
            value={value.value(data[key as keyof useCachePageRet])}
            color={value.color}
            className="bg-blue-200 col-span-1"
            icon={value.icon}
            isLoading={value.isLoading(data[key as keyof useCachePageRet])}
          />
        ))}
      </Grid>
      <Grid className="w-full max-w-3xl items-center grid-cols-2 gap-3">
        <Col>
          <h1 className="text-2xl font-semibold">Top Cached models</h1>
          <ThemedMiniTable
            columns={[{ key: "hello", hidden: false, name: "Model" }]}
            rows={[
              {
                hello: "hello",
              },
              {
                hello: "hello",
              },
            ]}
          />
        </Col>
        <div>Top Cached models</div>
      </Grid>
      <div>Graph of caches over time</div>
      <Row className="justify-between w-full"></Row>
      <div className="bg-white w-full max-w-2xl text-center">
        <h1 className="text-2xl font-semibold">Top Cached request</h1>
        <Col></Col>
      </div>
    </Col>
  );
};

export default CachePage;
