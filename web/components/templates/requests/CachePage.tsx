import { ArrowPathIcon } from "@heroicons/react/24/outline";
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

interface CachePropProps {}

const CachePage = (props: CachePropProps) => {
  const totalCached = useQuery({
    queryKey: ["totalCached"],
    queryFn: async () => {
      const data = fetch("/api/cache/total").then(
        (res) => res.json() as Promise<Result<number, string>>
      );
      return data;
    },
  });

  const totalSavings = useQuery({
    queryKey: ["totalSavings"],
    queryFn: async () => {
      const data = fetch("/api/cache/total_savings").then(
        (res) => res.json() as Promise<Result<number, string>>
      );
      return data;
    },
  });
  console.log(totalCached.data);
  return (
    <Col className="w-full items-center">
      <Row className="justify-between w-full max-w-3xl">
        <Col>
          <div>{totalCached.data?.data ?? "0"}</div>
          <div>Total Hits</div>
        </Col>

        <div>Cache hits per day</div>
        <Col>
          <div>{totalSavings.data?.data ?? "0"}</div>
          <div>Total Savings</div>
        </Col>
      </Row>
      <div className="bg-white w-full max-w-2xl text-center">
        <h1 className="text-2xl font-semibold">Top Cached request</h1>

        <Col></Col>
      </div>
    </Col>
  );
};

export default CachePage;
