import React, { useState } from "react";
import ThemedTableV5 from "./themedTableV5";
import AuthHeader from "../../shared/authHeader";
import useRequestsPageV2 from "./useRequestsPageV2";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";
import RequestDrawerV2 from "./requestDrawerV2";
import TableFooter from "./tableFooter";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  getTimeIntervalAgo,
  TimeInterval,
} from "../../../lib/timeCalculations/time";
import { INITIAL_COLUMNS } from "./initialColumns";
import { useDebounce } from "../../../services/hooks/debounce";
import { DateRange } from "react-day-picker";
import { addDays, endOfDay, startOfDay } from "date-fns";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";

interface RequestsPageV2Props {
  currentPage: number;
  pageSize: number;
  sort: SortLeafRequest;
}

const RequestsPageV2 = (props: RequestsPageV2Props) => {
  const { currentPage, pageSize, sort } = props;

  const [page, setPage] = useState<number>(currentPage);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [open, setOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<NormalizedRequest>();
  const [timeFilter, setTimeFilter] = useState<FilterNode>({
    request: {
      created_at: {
        gte: getTimeIntervalAgo("24h").toISOString(),
      },
    },
  });
  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRow[]>([]);

  const debouncedAdvancedFilter = useDebounce(advancedFilters, 500);

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
    debouncedAdvancedFilter,
    {
      left: timeFilter,
      operator: "and",
      right: "all",
    },
    sort
  );

  const onPageSizeChangeHandler = async (newPageSize: number) => {
    setCurrentPageSize(newPageSize);
    refetch();
  };

  const onPageChangeHandler = async (newPageNumber: number) => {
    setPage(newPageNumber);
    refetch();
  };

  const onTimeSelectHandler = (key: TimeInterval, value: string) => {
    // if key is custom, add a lte filter
    if (key === "custom") {
      //  `custom:${start.toISOString()}_${end.toISOString()}`
      const [start, end] = value.split("_");
      const filter: FilterNode = {
        left: {
          request: {
            created_at: {
              gte: new Date(start).toISOString(),
            },
          },
        },
        operator: "and",
        right: {
          request: {
            created_at: {
              lte: new Date(end).toISOString(),
            },
          },
        },
      };
      setTimeFilter(filter);
      return;
    }
    setTimeFilter({
      request: {
        created_at: {
          gte: getTimeIntervalAgo(key).toISOString(),
        },
      },
    });

    // refetch();
  };

  const columnsWithProperties = [...INITIAL_COLUMNS].concat(
    properties.map((property) => ({
      accessorFn: (row) =>
        row.customProperties ? row.customProperties[property] : "",
      id: `Custom - ${property}`,
      header: property,
      cell: (info) => info.getValue(),
    }))
  );

  return (
    <div>
      <AuthHeader title={"Requests"} />
      <div className="flex flex-col space-y-4">
        <ThemedTableV5
          defaultData={requests || []}
          defaultColumns={columnsWithProperties}
          dataLoading={isDataLoading}
          sortable={{
            currentSortLeaf: sort,
          }}
          header={{
            onTimeSelectHandler: onTimeSelectHandler,
            flattenedExportData: requests.map((request) => {
              const flattenedRequest: any = {};
              Object.entries(request).forEach(([key, value]) => {
                // key is properties and value is not null
                if (key === "customProperties" && value !== null) {
                  Object.entries(value).forEach(([key, value]) => {
                    if (value !== null) {
                      flattenedRequest[key] = value;
                    }
                  });
                } else {
                  flattenedRequest[key] = value;
                }
              });
              return flattenedRequest;
            }),
            filterMap: filterMap,
            filters: advancedFilters,
            setAdvancedFilters: setAdvancedFilters,
            searchPropertyFilters: searchPropertyFilters,
          }}
          onRowSelect={(row) => {
            setSelectedData(row);
            setOpen(true);
          }}
        />
        <TableFooter
          currentPage={currentPage}
          pageSize={pageSize}
          isCountLoading={isCountLoading}
          count={count || 0}
          onPageChange={onPageChangeHandler}
          onPageSizeChange={onPageSizeChangeHandler}
        />
      </div>
      <RequestDrawerV2
        open={open}
        setOpen={setOpen}
        request={selectedData}
        properties={properties}
      />
    </div>
  );
};

export default RequestsPageV2;
