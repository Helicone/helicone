import {
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Metrics } from "../../../lib/api/metrics/metrics";
import {
  getDashboardData,
  GraphDataState,
  initialGraphDataState,
} from "../../../lib/dashboardGraphs";
import { Result } from "../../../lib/result";
import {
  getTimeMap,
  timeGraphConfig,
} from "../../../lib/timeCalculations/constants";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { useGetProperties } from "../../../services/hooks/properties";
import { useGetPropertyParams } from "../../../services/hooks/propertyParams";
import {
  FilterLeaf,
  FilterNode,
  getPropertyFilters,
} from "../../../services/lib/filters/filterDefs";
import { RequestsTableFilter } from "../../../services/lib/filters/frontendFilterDefs";
import { Database } from "../../../supabase/database.types";
import AuthHeader from "../../shared/authHeader";
import { clsx } from "../../shared/clsx";
import AuthLayout from "../../shared/layout/authLayout";
import useNotification from "../../shared/notification/useNotification";
import ThemedTableHeader from "../../shared/themed/themedTableHeader";
import { Filter } from "../../shared/themed/themedTableHeader";
import { Filters } from "../dashboard/filters";

import { MetricsPanel } from "../dashboard/metricsPanel";
import TimeGraphWHeader from "../dashboard/timeGraphWHeader";
import KeyPage from "../keys/keyPage";

interface DashboardPageProps {
  user: User;
  keys: Database["public"]["Tables"]["user_api_keys"]["Row"][];
}

export type Loading<T> = T | "loading";

const BaseUrlInstructions = () => {
  const { setNotification } = useNotification();
  const [lang, setLang] = useState<"python" | "curl" | "node">("node");

  const codeSnippet = () => {
    switch (lang) {
      case "python":
        return (
          <>
            <div className="flex flex-row gap-2">
              <p className="text-gray-300">
                # Change the default base API url to Helicone&apos;s
              </p>
            </div>
            <div className="flex flex-row gap-2">
              <p className="text-red-500">import </p>
              <p className="text-gray-300">openai </p>
            </div>
            <div className="flex flex-row gap-2 -ml-4 bg-green-900">
              <p className="text-green-700 pl-1 -mr-1 bg-green-900">+</p>
              <p className="text-gray-300">openai.api_base</p>
              <p className="text-blue-300">=</p>
              <p className="text-blue-400">
                &quot;https://oai.hconeai.com/v1&quot;
              </p>
            </div>
          </>
        );
      case "curl":
        return (
          <>
            <div className="flex flex-row gap-2">
              <p className="text-gray-300">Replace the OpenAI base url</p>
            </div>
            <div className="flex flex-row gap-2">
              <p className="text-purple-500">POST </p>
              <p className="text-red-500">https://api.openai.com/v1</p>
            </div>
            <div className="flex flex-row gap-2 mt-4">
              <p className="text-gray-300">with Helicone</p>
            </div>
            <div className="flex flex-row gap-2 -ml-4 bg-green-900">
              <p className="text-green-700 pl-1 -mr-1 bg-green-900">+</p>
              <p className="text-purple-500">POST </p>
              <p className="text-green-500">https://oai.hconeai.com/v1</p>
            </div>
          </>
        );
      case "node":
        return (
          <>
            <div className="flex flex-row gap-2">
              <p className="text-gray-300">
                {`//`} Add a basePath to the Configuration:
              </p>
            </div>
            <div className="flex flex-row xs:gap-0.5 gap-1">
              <p className="text-red-500">import</p>
              <p className="text-blue-300">{`{`}</p>
              <p className="text-gray-300">Configuration,OpenAIApi </p>
              <p className="text-blue-300">{`}`}</p>
              <p className="text-red-500">from</p>
              <p className="text-blue-300">{`"openai"`}</p>
            </div>
            <div className="flex flex-col">
              <div className="flex flex-row gap-2">
                <p className="text-red-500">const </p>
                <p className="text-blue-300">configuration </p>
                <p className="text-red-500">= new</p>
                <div className="flex flex-row">
                  <p className="text-purple-400">Configuration</p>
                  <p className="text-blue-300">{`(`} </p>
                  <p className="text-orange-500">{`{`}</p>
                </div>
              </div>
              <div className="flex flex-row gap-0 ml-4">
                <p className="text-gray-300">apiKey: process.env.</p>
                <div className="flex flex-row">
                  <p className="text-blue-300">OPENAI_API_KEY</p>
                  <p className="text-gray-300">,</p>
                </div>
              </div>
              <div className="flex flex-row gap-2 pl-4 bg-green-900">
                <div className="flex flex-row">
                  <p className="text-green-700 -ml-3 pr-1">+</p>
                  <p className="text-gray-300">basePath:</p>
                </div>

                <div className="flex flex-row">
                  <p className="text-blue-300">{`"https://oai.hconeai.com/v1"`}</p>
                  <p className="text-gray-300">,</p>
                </div>
              </div>
              <div className="flex flex-row">
                <p className="text-orange-500">{`}`}</p>
                <p className="text-blue-300">{`)`} </p>
                <p className="text-gray-300">;</p>
              </div>
            </div>
            <div className="flex flex-row gap-2">
              <p className="text-red-500">const </p>
              <p className="text-blue-300">openai </p>
              <p className="text-red-500">= new</p>
              <div className="flex flex-row">
                <p className="text-purple-400">OpenAIApi</p>
                <p className="text-blue-300">{`(configuration)`} </p>
                <p className="text-gray-300">;</p>
              </div>
            </div>
          </>
        );
      default:
        return <div></div>;
    }
  };

  const copyLineHandler = () => {
    switch (lang) {
      case "node":
        navigator.clipboard.writeText(
          `basePath: "https://oai.hconeai.com/v1" `
        );
        setNotification("Copied Node code to clipboard", "success");
        break;
      case "python":
        navigator.clipboard.writeText(
          `openai.api_base="https://oai.hconeai.com/v1"`
        );
        setNotification("Copied Python code to clipboard", "success");
        break;
      case "curl":
        navigator.clipboard.writeText(`https://oai.hconeai.com/v1`);
        setNotification("Copied cURL code to clipboard", "success");
        break;
      default:
        navigator.clipboard.writeText("hello");
    }
  };

  return (
    <div className="space-y-4">
      <span className="isolate inline-flex rounded-md shadow-sm w-full">
        <button
          onClick={() => setLang("node")}
          type="button"
          className={clsx(
            lang === "node" ? "bg-gray-200" : "",
            "w-full text-center justify-center relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          )}
        >
          Node.js
        </button>
        <button
          onClick={() => setLang("python")}
          type="button"
          className={clsx(
            lang === "python" ? "bg-gray-200" : "",
            "w-full text-center justify-center relative -ml-px inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          )}
        >
          Python
        </button>
        <button
          onClick={() => setLang("curl")}
          type="button"
          className={clsx(
            lang === "curl" ? "bg-gray-200" : "",
            "w-full text-center justify-center relative -ml-px inline-flex items-center rounded-r-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          )}
        >
          Curl
        </button>
      </span>
      <div className="overflow-hidden rounded-md bg-gray-900 ring-1 ring-white/10">
        <div className="px-6 pt-6 pb-8 min-h-[20em] flex flex-col gap-4 font-mono text-[10px] sm:text-sm">
          {codeSnippet()}
        </div>
      </div>
      <button
        onClick={copyLineHandler}
        className="flex flex-row w-full justify-center items-center rounded-md bg-gray-200 text-black px-3.5 py-1.5 text-base font-semibold leading-7 shadow-sm hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
        Copy
      </button>
    </div>
  );
};

const WelcomePage = (props: DashboardPageProps) => {
  const { user, keys } = props;
  const [timeData, setTimeData] = useState<GraphDataState>(
    initialGraphDataState
  );

  const [metrics, setMetrics] =
    useState<Loading<Result<Metrics, string>>>("loading");
  const [interval, setInterval] = useState<TimeInterval>("1m");
  const [filter, setFilter] = useState<FilterNode>("all");
  const [apiKeyFilter, setApiKeyFilter] = useState<FilterNode>("all");
  const [timeFilter, setTimeFilter] = useState<FilterLeaf>({
    request: {
      created_at: {
        gte: getTimeIntervalAgo("1m").toISOString(),
        lte: new Date().toISOString(),
      },
    },
  });

  const { properties, isLoading: isPropertiesLoading } = useGetProperties();
  const { propertyParams } = useGetPropertyParams();

  useEffect(() => {
    getDashboardData(
      timeFilter,
      {
        left: filter,
        operator: "and",
        right: apiKeyFilter,
      },
      setMetrics,
      setTimeData
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter, filter, apiKeyFilter]);

  const propertyFilterMap = {
    properties: {
      label: "Properties",
      columns: getPropertyFilters(
        properties,
        propertyParams.map((p) => p.property_param)
      ),
    },
  };
  const filterMap =
    properties.length > 0
      ? { ...propertyFilterMap, ...RequestsTableFilter }
      : RequestsTableFilter;

  return (
    <AuthLayout user={user}>
      <div
        className="flex flex-col flex-1 gap-5 w-full max-w-3xl  px-4 sm:px-6 lg:px-8 pb-10"
        style={{ minHeight: "calc(100vh - 4rem)" }}
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to Helicone 🚀
        </h1>
        <p className="text-gray-500">
          Helicone is a tool to help you understand your API traffic. It's
          currently in beta, so please let us know if you have any feedback or
          questions.
        </p>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-gray-900">
              Getting Started
            </h2>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-5">
                <h3 className="text-xl font-bold text-gray-900">
                  1. Change your OpenAI base url
                </h3>
                <BaseUrlInstructions />
                <h3 className="text-xl font-bold text-gray-900">
                  2. Add your hashed OpenAI API key
                </h3>
                <KeyPage></KeyPage>

                <h3 className="text-xl font-bold text-gray-900">
                  3. You{"'"}re all set!
                </h3>
                <p className="text-gray-500">
                  Now you can start sending requests to your API and Helicone
                  will start collecting data.
                </p>
                <div className="text-start">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center rounded-md bg-gradient-to-r from-sky-600 to-indigo-500 bg-origin-border px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <ArrowTopRightOnSquareIcon
                      className="-ml-1 mr-2 h-5 w-5"
                      aria-hidden="true"
                    />
                    Dashboard
                  </Link>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  4. (Optional) Advanced features
                </h3>
                <ul
                  className="list-none list-inside text-gray-500"
                  style={{ paddingLeft: "1.5rem" }}
                >
                  <li className="text-gray-500">
                    <Link
                      href="https://docs.helicone.ai/advanced-usage/caching"
                      className="text-indigo-500 hover:text-indigo-600"
                    >
                      Caching
                    </Link>
                    : Helicone offers advanced caching features to reduce the
                    number of requests you send to your API.
                  </li>
                  <li className="text-gray-500">
                    <Link
                      href="https://docs.helicone.ai/advanced-usage/custom-properties"
                      className="text-indigo-500 hover:text-indigo-600"
                    >
                      Custom Properties
                    </Link>
                    : Helicone allows you to add custom properties to your
                    requests.
                  </li>

                  <li className="text-gray-500">
                    <Link
                      href="https://docs.helicone.ai/advanced-usage/user-metrics"
                      className="text-indigo-500 hover:text-indigo-600"
                    >
                      User Metrics
                    </Link>
                    : User tracking is a powerful tool to understand your users
                    and their behavior.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default WelcomePage;
