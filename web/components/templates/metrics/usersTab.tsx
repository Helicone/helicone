import { Dialog } from "@headlessui/react";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { truncString } from "../../../lib/stringHelpers";
import ThemedModal from "../../shared/themedModal";

interface UsersTabProps {}

interface UserMetricsDB {
  user_id: string;
  first_active: string;
  last_active: string;
  total_requests: string;
  average_requests_per_day_active: string;
  average_tokens_per_request: string;
}

interface UserRow {
  user_id: string;
  active_for: string;
  last_active: string;
  total_requests: string;
  average_requests_per_day_active: string;
  average_tokens_per_request: string;
}

const UsersTab = (props: UsersTabProps) => {
  const {} = props;

  const [data, setData] = useState<UserRow[]>([]);
  const [open, setOpen] = useState(true);
  const [index, setIndex] = useState<number>();
  const [selectedUser, setSelectedUser] = useState<UserRow>();

  const client = useSupabaseClient();

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await client
        .from("user_metrics_rbac")
        .select("*")
        .limit(100);
      if (error) {
        console.log(error);
      } else {
        console.log(data);
        const cleanedData = data.map((row, i) => {
          return {
            user_id: row.user_id ? truncString(row.user_id, 11) : "NULL",
            active_for: (
              (new Date().getTime() - new Date(row.first_active).getTime()) /
              (1000 * 3600 * 24)
            ).toFixed(2),
            last_active: new Date(row.last_active).toLocaleString(),
            total_requests: row.total_requests,
            average_requests_per_day_active: (
              +row.total_requests /
              Math.ceil(
                (new Date().getTime() - new Date(row.first_active).getTime()) /
                  (1000 * 3600 * 24)
              )
            ).toFixed(2),
            average_tokens_per_request: row.average_tokens_per_request
              ? (+row.average_tokens_per_request).toFixed(2)
              : "{{ no tokens found }}",
          };
        });
        setData(cleanedData);
      }
    };
    fetch();
  }, [client]);

  const selectRowHandler = (row: UserRow, idx: number) => {};

  return (
    <>
      <div className="">
        <div className="mt-4 sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <p className="mt-2 text-sm text-gray-700">
              Showing the first 100 users
            </p>
          </div>
          {/* <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              Export
            </button>
          </div> */}
        </div>
        <div className="mt-4 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-white">
                    <tr>
                      <th
                        scope="col"
                        className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Id
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Active For
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Last Active
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Total Requests
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Avg Requests / Day
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Avg Tokens / Request
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Total Cost
                      </th>

                      <th
                        scope="col"
                        className="relative whitespace-nowrap py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">Edit</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {data.map((row, idx) => (
                      <tr key={row.user_id}>
                        <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                          {row.user_id}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-sm font-medium text-gray-900">
                          {row.active_for} days
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-900">
                          {row.last_active}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                          {row.total_requests}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                          {row.average_requests_per_day_active}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                          {row.average_tokens_per_request}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                          $ TBD
                        </td>
                        <td className="relative whitespace-nowrap py-2 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            className="text-sky-600 hover:text-sky-900"
                            onClick={() => selectRowHandler(row, idx)}
                          >
                            View
                            <span className="sr-only">, {row.user_id}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* {open && selectedUser !== undefined && index !== undefined && (
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
                  <p>Time:</p>
                  <p>
                    {new Date(
                      selectedData.request_created_at!
                    ).toLocaleString()}
                  </p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Request:</p>
                  <p className="max-w-xl whitespace-pre-wrap text-left">
                    {selectedData.request_body?.prompt
                      ? selectedData.request_body.prompt
                      : "{{ no prompt }}"}
                  </p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Response:</p>
                  <p className="max-w-xl whitespace-pre-wrap text-left">
                    {selectedData.response_body!.choices
                      ? selectedData.response_body!.choices[0].text
                      : "{{ no response }}"}
                  </p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Duration:</p>
                  <p>
                    {(
                      (new Date(selectedData.response_created_at!).getTime() -
                        new Date(selectedData.request_created_at!).getTime()) /
                      1000
                    ).toString()}{" "}
                    s
                  </p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Tokens:</p>
                  <p>
                    {selectedData.response_body!.usage
                      ? selectedData.response_body!.usage.total_tokens
                      : "{{ no tokens found }}"}
                  </p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Log Probability:</p>
                  <p>{probabilities[index]}</p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>User Id:</p>
                  <p>{selectedData.request_user_id}</p>
                </li>
                <li className="w-full flex flex-row justify-between gap-4 text-sm">
                  <p>Model:</p>
                  <p>{selectedData.request_body?.model}</p>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 w-full justify-between gap-4 flex flex-row">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-gray-300 px-4 py-2 text-base font-medium text-black shadow-sm hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:text-sm"
              onClick={() => {
                // TODO: add copy to clipboard notification
                navigator.clipboard.writeText(JSON.stringify(selectedData));
              }}
            >
              Copy
            </button>
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:text-sm"
              onClick={() => setOpen(false)}
            >
              Done
            </button>
          </div>
        </ThemedModal>
      )} */}
    </>
  );
};

export default UsersTab;
