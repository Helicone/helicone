import { useRouter } from "next/router";
import AuthHeader from "../../shared/authHeader";
import FilterBadge from "../../ui/filters/filterBadge";
import { clsx } from "../../shared/clsx";
import {
  NumberInput,
  SearchSelect,
  SearchSelectItem,
  Select,
  SelectItem,
} from "@tremor/react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import TimeFilterBadge from "./filters/timeFilterBadge";
import ModelFilterBadge from "./filters/modelFilterBadge";
import StatusFilterBadge from "./filters/statusFilterBadge";
import TokenFilterBadge from "./filters/tokenFilterBadge";
import TextFilterBadge from "./filters/shared/textFilterBadge";
import MoreFiltersBadge from "./filters/moreFiltersBadge";
import FeedbackFilterBadge from "./filters/feedbackFilterBadge";
import useRequestsPageV2 from "../requestsV2/useRequestsPageV2";
import {
  SortDirection,
  SortLeafRequest,
} from "../../../services/lib/sorts/requests/sorts";

function getSortLeaf(
  sortKey: string | null,
  sortDirection: SortDirection | null,
  isCustomProperty: boolean,
  isCached: boolean
): SortLeafRequest {
  if (isCached && sortKey === "created_at") {
    sortKey = "cache_created_at";
  }
  if (sortKey && sortDirection && isCustomProperty) {
    return {
      properties: {
        [sortKey]: sortDirection,
      },
    };
  } else if (sortKey && sortDirection) {
    return {
      [sortKey]: sortDirection,
    };
  } else if (isCached) {
    return {
      cache_created_at: "desc",
    };
  } else {
    return {
      created_at: "desc",
    };
  }
}

interface RequestsPageProps {
  page: number;
  currentPageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
}

const RequestsPage = (props: RequestsPageProps) => {
  const { page, currentPageSize, sort } = props;

  const router = useRouter();

  const sortLeaf: SortLeafRequest = getSortLeaf(
    sort.sortKey,
    sort.sortDirection,
    sort.isCustomProperty,
    false
  );

  const {
    count,
    isDataLoading,
    isCountLoading,
    requests,
    properties,
    refetch,
    filterMap,
    searchPropertyFilters,
  } = useRequestsPageV2(
    page,
    currentPageSize,
    [],
    {
      left: "all",
      operator: "and",
      right: "all",
    },
    sortLeaf,
    false,
    false // isLive
  );

  return (
    <>
      <AuthHeader title={"Requests"} />
      <div className="flex flex-col space-y-4 pb-96">
        <div className="flex flex-row space-x-2 items-center w-full">
          <TimeFilterBadge />
          <ModelFilterBadge />
          <StatusFilterBadge />
          <TokenFilterBadge />
          <TextFilterBadge title={"User"} filterKey={"user"} />
          <FeedbackFilterBadge />
          <MoreFiltersBadge properties={properties} />
        </div>
      </div>
    </>
  );
};

export default RequestsPage;
