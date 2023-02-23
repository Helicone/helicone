import { Dialog } from "@headlessui/react";
import { ArrowDownTrayIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { CSVLink } from "react-csv";
import { truncString } from "../../../lib/stringHelpers";
import { UserRow } from "../../../services/lib/users";
import AuthHeader from "../../shared/authHeader";
import { clsx } from "../../shared/clsx";
import Notification from "../../shared/notification/Notification";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import ThemedTableV2 from "../../ThemedTableV2";

interface UsersPageProps {
  users: UserRow[];
  error: string | null;
  count: number | null;
  page: number;
  from: number;
  to: number;
}

const UsersPage = (props: UsersPageProps) => {
  const { users, error, count, page, from, to } = props;

  const router = useRouter();

  const [open, setOpen] = useState(true);
  const [index, setIndex] = useState<number>();
  const [selectedUser, setSelectedUser] = useState<UserRow>();

  const selectRowHandler = (row: UserRow, idx: number) => {
    setIndex(idx);
    setSelectedUser(row);
    setOpen(true);
  };

  const hasPrevious = page > 1;
  const hasNext = to <= count!;

  return (
    <>
      <AuthHeader
        title={"Users"}
        actions={
          <CSVLink
            data={users}
            filename={"users.csv"}
            className="flex"
            target="_blank"
          >
            <button
              type="button"
              className="inline-flex sm:hidden items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:w-auto"
            >
              <ArrowDownTrayIcon className="mr-1 flex-shrink-0 h-4 w-4" />
              Export
            </button>
            <button
              type="button"
              className="hidden sm:inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:w-auto"
            >
              <ArrowDownTrayIcon className="mr-2 flex-shrink-0 h-4 w-4" />
              Export to CSV
            </button>
          </CSVLink>
        }
      />
      <div className="">
        <ThemedTableV2
          columns={[
            {
              key: "user_id",
              label: "Id",
            },
            {
              key: "active_for",
              label: "Active For",
            },
            {
              key: "last_active",
              label: "Last Active",
            },
            {
              key: "total_requests",
              label: "Requests",
            },
            {
              key: "average_requests_per_day_active",
              label: "Avg Reqs / Day",
            },
            {
              key: "average_tokens_per_request",
              label: "Avg Tokens / Req",
            },
            {
              key: "total_cost",
              label: "Total Cost",
              format: (value: any) => `$TBD`,
            },
          ]}
          rows={users}
          page={page}
          from={from}
          to={to}
          count={count}
          onSelectHandler={selectRowHandler}
        />
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
                Request Information
              </Dialog.Title>
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
                  <p className="italic">(coming soon)</p>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 w-full justify-between gap-4 flex flex-row">
            <button
              type="button"
              tabIndex={-1}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-gray-300 px-4 py-2 text-base font-medium text-black shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:text-sm"
              onClick={() => {
                // TODO: add copy to clipboard notification
                navigator.clipboard.writeText(JSON.stringify(selectedUser));
              }}
            >
              Copy
            </button>
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
