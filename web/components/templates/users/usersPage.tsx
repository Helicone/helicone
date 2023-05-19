import { Dialog } from "@headlessui/react";
import {
  ClipboardDocumentIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

import { ColumnOrderState, ColumnSizingState } from "@tanstack/react-table";
import Papa from "papaparse";
import { UserMetric } from "../../../lib/api/users/users";
import { useDebounce } from "../../../services/hooks/debounce";
import { useUsers } from "../../../services/hooks/users";
import {
  filterListToTree,
  filterUIToFilterLeafs,
} from "../../../services/lib/filters/filterDefs";
import { userTableFilters } from "../../../services/lib/filters/frontendFilterDefs";
import { SortDirection } from "../../../services/lib/sorts/requests/sorts";
import { SortLeafUsers } from "../../../services/lib/sorts/users/sorts";
import { UserRow } from "../../../services/lib/users";
import AuthHeader from "../../shared/authHeader";
import LoadingAnimation from "../../shared/loadingAnimation";
import useNotification from "../../shared/notification/useNotification";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import ThemedModal from "../../shared/themed/themedModal";
import ThemedTableHeader from "../../shared/themed/themedTableHeader";
import { Column } from "../../ThemedTableV2";
import UserTable from "./userTable";
import { getUSDate } from "../../shared/utils/utils";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface UsersPageProps {
  page: number;
  pageSize: number;
}

const UsersPage = (props: UsersPageProps) => {
  const { page, pageSize } = props;

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRow[]>([]);
  const debouncedAdvancedFilters = useDebounce(advancedFilters, 2_000); // 2 seconds

  const [currentPage, setCurrentPage] = useState<number>(page);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);

  const [sortLeaf, setSortLeaf] = useState<SortLeafUsers>({
    last_active: "desc",
  });
  const [orderBy, setOrderBy] = useState<{
    column: keyof UserMetric;
    direction: SortDirection;
  }>({
    column: "last_active",
    direction: "desc",
  });

  const { users, count, from, isLoading, to, refetch } = useUsers(
    currentPage,
    currentPageSize,
    sortLeaf,
    filterListToTree(
      filterUIToFilterLeafs(userTableFilters, debouncedAdvancedFilters),
      "and"
    )
  );

  const { setNotification } = useNotification();

  const [open, setOpen] = useState(true);
  const [index, setIndex] = useState<number>();
  const [selectedUser, setSelectedUser] = useState<UserRow>();
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const onPageSizeChangeHandler = async (newPageSize: number) => {
    setCurrentPageSize(newPageSize);
    refetch();
  };

  const onPageChangeHandler = async (newPageNumber: number) => {
    setCurrentPage(newPageNumber);
    refetch();
  };

  const selectRowHandler = (row: UserRow, idx: number) => {
    setIndex(idx);
    setSelectedUser(row);
    setOpen(true);
  };

  const initialColumns: Column[] = [
    {
      key: "user_id",
      active: true,
      label: "Id",
      type: "text",
      filter: true,
      minWidth: 170,
      format: (value: string) => (value ? value : "No user ID"),
      toSortLeaf: (direction) => ({
        user_id: direction,
      }),
    },
    {
      key: "active_for",
      label: "Active For",
      active: true,
      filter: false,
      format: (value: string) => `${value} days`,
      toSortLeaf: (direction) => ({
        active_for: direction,
      }),
    },
    {
      key: "last_active",
      label: "Last Active",
      active: true,
      type: "timestamp",
      filter: true,
      minWidth: 170,
      format: (value: string) => getUSDate(value),
      toSortLeaf: (direction) => ({
        last_active: direction,
      }),
    },
    {
      key: "total_requests",
      label: "Requests",
      active: true,
      type: "number",
      filter: true,
      format: (value: string) => Number(value).toFixed(2),
      toSortLeaf: (direction) => ({
        total_requests: direction,
      }),
    },
    {
      key: "average_requests_per_day_active",
      label: "Avg Reqs / Day",
      active: true,
      type: "number",
      filter: true,
      format: (value: string) => Number(value).toFixed(2),
      toSortLeaf: (direction) => ({
        average_requests_per_day_active: direction,
      }),
    },
    {
      key: "average_tokens_per_request",
      label: "Avg Tokens / Req",
      active: true,
      type: "number",
      filter: true,
      format: (value: string) => Number(value).toFixed(2),
      toSortLeaf: (direction) => ({
        average_tokens_per_request: direction,
      }),
    },
    {
      key: "cost",
      active: true,
      label: "Total Cost (USD)",
      format: (value: any) =>
        Number(value) > 0.01
          ? Number(value).toFixed(2)
          : Number(value).toString(),
      toSortLeaf(direction) {
        return {
          cost: direction,
        };
      },
    },
  ];

  const [columns, setColumns] = useState<Column[]>(initialColumns);

  const columnOrderIndex = columns.findIndex((c) => c.key === orderBy.column);

  if (columnOrderIndex > -1) {
    columns[columnOrderIndex].sortBy = orderBy.direction;
  }

  const [openExport, setOpenExport] = useState(false);
  const [downloadingCSV, setDownloadingCSV] = useState<boolean>(false);

  const csvDownload = async (filtered: boolean) => {
    setDownloadingCSV(true);
    fetch("/api/request_users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: advancedFilters,
        offset: 0,
        limit: 1000,
        sort: sortLeaf,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        const users = res.data;
        const filteredUsers = users.map((user: any) => {
          const obj: any = {};
          columns.forEach((col) => {
            if (filtered) {
              if (col.active) {
                obj[col.key] = user[col.key];
              }
            } else {
              obj[col.key] = user[col.key];
            }
          });
          return obj;
        });

        // Convert JSON data to CSV
        const csv = Papa.unparse(filteredUsers);

        // Create a blob with the CSV data
        const blob = new Blob([csv], { type: "text/csv" });

        // Create a download link and click it to start the download
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "users.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((e) => console.error(e))
      .finally(() => {
        setDownloadingCSV(false);
        setOpenExport(false);
      });
  };

  return (
    <>
      <AuthHeader title={"Users"} />
      <div className="space-y-2">
        <ThemedTableHeader
          csvExport={{
            onClick: csvDownload,
            downloadingCSV,
            openExport,
            setOpenExport,
          }}
          editColumns={{
            columns,
            onColumnCallback: (newColumns) => {
              setColumns(newColumns);
            },
          }}
          isFetching={isLoading}
          advancedFilter={{
            filterMap: userTableFilters,
            onAdvancedFilter: setAdvancedFilters,
            filters: advancedFilters,
            searchPropertyFilters: async () => ({
              data: null,
              error: "Not implemented",
            }),
          }}
        />
        {isLoading || from === undefined || to === undefined ? (
          <LoadingAnimation title="Getting users" />
        ) : (
          <UserTable
            columnOrder={{
              columnOrder,
              setColumnOrder,
            }}
            columnSizing={{
              columnSizing,
              setColumnSizing,
            }}
            data={users}
            columns={columns}
            count={count}
            page={page}
            from={from}
            to={to}
            onSelectHandler={selectRowHandler}
            onPageChangeHandler={onPageChangeHandler}
            onPageSizeChangeHandler={onPageSizeChangeHandler}
            onSortHandler={(key) => {
              console.log(key);
              if (key.key === orderBy.column) {
                console.log(1);
                setOrderBy({
                  column: key.key,
                  direction: orderBy.direction === "asc" ? "desc" : "asc",
                });
                key.toSortLeaf &&
                  setSortLeaf(
                    key.toSortLeaf(orderBy.direction === "asc" ? "desc" : "asc")
                  );
              } else {
                console.log(2);
                key.toSortLeaf && setSortLeaf(key.toSortLeaf("asc"));
                setOrderBy({
                  column: key.key,
                  direction: "asc",
                });
              }
            }}
          />
        )}
      </div>
      {open && selectedUser !== undefined && index !== undefined && (
        <ThemedModal open={open} setOpen={setOpen}>
          <div>
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
              <UserCircleIcon
                className="h-8 w-8 text-sky-600"
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <Dialog.Title
                as="h3"
                className="text-lg font-medium leading-6 text-gray-900"
              >
                User Information
              </Dialog.Title>
              <button
                type="button"
                tabIndex={-1}
                className="inline-flex w-full justify-center text-base font-medium text-gray-500 sm:text-sm items-center"
                onClick={() => {
                  setNotification("Copied to clipboard", "success");
                  navigator.clipboard.writeText(JSON.stringify(selectedUser));
                }}
              >
                Copy to clipboard
                <ClipboardDocumentIcon className="h-5 w-5 ml-1" />
              </button>
              <ul className="mt-4 space-y-2">
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>User Id:</p>
                  <p>{selectedUser.user_id}</p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Active For:</p>
                  <p className="max-w-xl whitespace-pre-wrap text-left">
                    {selectedUser.active_for} days
                  </p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Last Active:</p>
                  <p className="max-w-xl whitespace-pre-wrap text-left">
                    {selectedUser.last_active}
                  </p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Total Requests:</p>
                  <p>{selectedUser.total_requests}</p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Average Requests per day:</p>
                  <p>{selectedUser.average_requests_per_day_active}</p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Tokens per request:</p>
                  <p> {selectedUser.average_tokens_per_request}</p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Total Cost:</p>
                  <p className="italic">{selectedUser.cost}</p>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 w-full justify-between gap-4 flex flex-row">
            <button
              type="button"
              tabIndex={-1}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:text-sm"
              onClick={() => setOpen(false)}
            >
              Done
            </button>
          </div>
        </ThemedModal>
      )}
    </>
  );
};

export default UsersPage;
