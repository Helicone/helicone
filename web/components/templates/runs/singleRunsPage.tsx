import React, { useEffect, useRef, useState } from "react";
import ThemedTableV5 from "../../shared/themed/table/themedTableV5";
import AuthHeader from "../../shared/authHeader";
import useRequestsPageV2 from "../requestsV2/useRequestsPageV2";
import { NormalizedRequest } from "../requestsV2/builder/abstractRequestBuilder";
import RequestDrawerV2 from "../requestsV2/requestDrawerV2";
import TableFooter from "../requestsV2/tableFooter";
import {
  SortDirection,
  SortLeafRequest,
} from "../../../services/lib/sorts/requests/sorts";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { getInitialColumns } from "./initialColumns";
import { useDebounce } from "../../../services/hooks/debounce";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";
import { useRouter } from "next/router";
import { HeliconeRequest } from "../../../lib/api/request/request";
import getRequestBuilder from "../requestsV2/builder/requestBuilder";
import { Result } from "../../../lib/result";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import useNotification from "../../shared/notification/useNotification";
import { Switch } from "@headlessui/react";
import { BoltIcon, BoltSlashIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { RequestView } from "../requestsV2/RequestView";
import { useRunPage } from "./useRunPage";
import { HeliconeRun } from "../../../lib/api/graphql/client/graphql";
import { ThemedSwitch } from "../../shared/themed/themedSwitch";
import { useSingleRunPage } from "./useSingleRunPage";

interface SingleRunsPageProps {
  runId: string | null;
}

const SingleRunPage = (props: SingleRunsPageProps) => {
  const { runId } = props;
  const [isLive, setIsLive] = useLocalStorage("isLive", false);

  // const router = useRouter();
  const { tasks } = useSingleRunPage(runId ?? "", isLive);

  return (
    <div>
      <AuthHeader
        title={`Run View `}
        headerActions={
          <div className="flex flex-row gap-2">
            <button
              onClick={() => refetch()}
              className="font-medium text-black text-sm items-center flex flex-row hover:text-sky-700"
            >
              <ArrowPathIcon
                className={clsx(false ? "animate-spin" : "", "h-5 w-5 inline")}
              />
            </button>
            <i
              className="text-gray-400 text-sm"
              style={{ alignSelf: "center" }}
            >
              {runId}
            </i>
          </div>
        }
        actions={
          <>
            <ThemedSwitch checked={isLive} onChange={setIsLive} label="Live" />
          </>
        }
      />
      {tasks && (
        <div className="flex flex-col gap-4">
          {tasks.data?.heliconeTask?.map((task) => (
            <>{task?.name}</>
          ))}
        </div>
      )}
    </div>
  );
};

export default SingleRunPage;
