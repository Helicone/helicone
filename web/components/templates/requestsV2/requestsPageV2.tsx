import React, { useState } from "react";
import ThemedTableV5 from "./themedTableV5";
import AuthHeader from "../../shared/authHeader";
import useRequestsPageV2 from "./useRequestsPageV2";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";
import RequestDrawerV2 from "./requestDrawerV2";
import TableFooter from "./tableFooter";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { getTimeIntervalAgo } from "../../../lib/timeCalculations/time";
import { INITIAL_COLUMNS } from "./initialColumns";
import { useDebounce } from "../../../services/hooks/debounce";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
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
  const [range, setRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRow[]>([]);

  const debouncedAdvancedFilter = useDebounce(advancedFilters, 500);

  const {
    count,
    isLoading,
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
      left: {
        request: {
          created_at: {
            gte: range?.from?.toISOString(),
          },
        },
      },
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
          dataLoading={isLoading}
          sortable={{
            currentSortLeaf: sort,
          }}
          header={{
            currentRange: range,
            onTimeFilter: (range) => {
              setRange(range);
            },
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
        {!isLoading && requests.length > 0 && (
          <TableFooter
            requestLength={requests.length}
            currentPage={currentPage}
            pageSize={pageSize}
            count={count || 0}
            onPageChange={onPageChangeHandler}
            onPageSizeChange={onPageSizeChangeHandler}
          />
        )}
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
