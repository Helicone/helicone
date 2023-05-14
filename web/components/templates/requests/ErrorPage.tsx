import { TvIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";

import { BoltIcon } from "@heroicons/react/20/solid";
import { BsCashCoin, BsHourglass } from "react-icons/bs";
import { middleTruncString } from "../../../lib/stringHelpers";
import {
  useCachePageMetrics,
  useErrorPageOvertime,
  useCachePageTopMetrics,
  useCachePageTopRequests,
} from "../../../services/hooks/useCachePage";
import { clsx } from "../../shared/clsx";
import { Col } from "../../shared/layout/col";
import { Grid } from "../../shared/layout/grid";
import Metric from "../../shared/themed/themedMetric";
import { ThemedMetricList } from "../../shared/themed/themedMetricList";
import { ThemedMiniTable } from "../../shared/themed/themedMiniTable";
import ThemedPieChart from "../cache/modelPIeChart";
import { MultilineRenderLineChart } from "../cache/timeGraph";
import LoadingAnimation from "../../shared/loadingAnimation";
import { SupabaseAuthClient } from "@supabase/supabase-js/dist/module/lib/SupabaseAuthClient";
import {
  useErrorPageCodes,
  useErrorPageLatest,
} from "../../../services/hooks/useErrorPage";

interface ErrorPropProps {}

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

const ErrorPage = (props: ErrorPropProps) => {
  const pageCodes = useErrorPageCodes();
  const latestRequests = useErrorPageLatest();
  const errorCodesOverTime = useErrorPageOvertime();
  const router = useRouter();

  return (
    <Col className="w-full items-center gap-10">
      <Col className="max-w-3xl gap-10 w-full">
        <Grid className="w-full items-center grid-cols-2 gap-3">
          <Col className="h-full bg-white rounded-md">
            <h1 className="text-2xl font-semibold text-center p-5">
              Error Codes
            </h1>
            <div className="h-full">
              <ThemedPieChart
                data={
                  pageCodes.errorCodes.data?.data
                    ?.filter((x) => x.error_code !== 200)
                    .map((x) => ({
                      name: "" + x.error_code,
                      value: +x.count,
                    })) ?? []
                }
                isLoading={pageCodes.errorCodes.isLoading}
              />
            </div>
          </Col>

          <Col className="h-60 bg-white rounded-md p-5 text-gray-700 justify-between">
            <div>
              Helicone captures the status code of every request made to your
              language model.
            </div>
            <i className="text-center text-gray-300">
              More docs and error features coming soon
            </i>
            <div />
          </Col>
        </Grid>
        <Col className="w-full gap-2 bg-white p-5 pb-2 rounded-md">
          <h1 className="text-2xl font-semibold text-center p-5">
            Error Codes Over Time
          </h1>

          <MultilineRenderLineChart
            data={errorCodesOverTime.overTime.data?.data ?? []}
            timeMap={(x) => new Date(x).toDateString()}
            valueFormatter={(x) => `${x}`}
            className="h-64"
          />
        </Col>

        <ThemedMiniTable
          className={{
            header: "items-center text-center font-semibold text-md h-12",
            td: clsx(
              "text-xs h-10 text-left pl-10 w-10 ",
              latestRequests.latestErrors.isLoading ? "animate-pulse" : ""
            ),
            tr: "hover:bg-slate-100 cursor-pointer",
          }}
          columns={[
            { key: "time", hidden: false, name: "Time" },
            { key: "status", hidden: false, name: "Status" },
            { key: "error", hidden: false, name: "error" },
            { key: "prompt", hidden: false, name: "Request" },
          ]}
          rows={
            latestRequests.latestErrors?.data?.data?.map((value) => ({
              status: {
                data: `${value.response_status}`,
              },
              error: {
                data: `${middleTruncString(
                  value.response_body?.error?.message ??
                    JSON.stringify(value.response_body) ??
                    "Unknown Error",
                  200
                )}`,
              },
              time: {
                data: `${new Date(value.response_created_at).toLocaleString()}`,
              },
              prompt: {
                data: `${middleTruncString(value.request_prompt ?? "", 50)}`,
              },
            })) ?? []
          }
          onRowClick={(x, i) => {
            router.push(
              `/requests?requestId=${latestRequests.latestErrors.data?.data?.[i].request_id}`
            );
          }}
          isLoading={latestRequests.latestErrors.isLoading}
          header="Latest Errors"
        />
      </Col>
    </Col>
  );
};

export default ErrorPage;
