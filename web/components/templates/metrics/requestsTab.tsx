import { Dialog } from "@headlessui/react";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { truncString } from "../../../lib/stringHelpers";
import { Database } from "../../../supabase/database.types";
import ThemedModal from "../../shared/themedModal";

type ResponseAndRequest = Omit<
  Database["public"]["Views"]["response_and_request_rbac"]["Row"],
  "response_body" | "request_body"
> & {
  response_body: {
    choices: any[] | null | undefined;
    usage:
      | {
          total_tokens: number;
        }
      | null
      | undefined;
  } | null;
  request_body: {
    prompt: string;
  } | null;
};

export default function RequestsTab() {
  const [data, setData] = useState<ResponseAndRequest[]>([]);
  const [index, setIndex] = useState<number>();
  const [selectedData, setSelectedData] = useState<ResponseAndRequest>();
  const [open, setOpen] = useState(true);

  const client = useSupabaseClient();

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await client
        .from("response_and_request_rbac")
        .select("*")
        .order("request_created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.log(error);
      } else {
        setData(data as ResponseAndRequest[]);
      }
    };
    fetch();
  }, [client]);

  const probabilities = data.map((d) => {
    const choice = d.response_body?.choices
      ? d.response_body?.choices[0]
      : null;
    if (!choice) {
      return null;
    }

    let prob;
    if (choice.logprobs !== undefined && choice.logprobs !== null) {
      const tokenLogprobs = choice.logprobs.token_logprobs;
      const sum = tokenLogprobs.reduce(
        (total: any, num: any) => total + num,
        0
      );
      prob = sum.toFixed(2);
    } else {
      prob = "";
    }

    return prob;
  });

  const selectRowHandler = (row: ResponseAndRequest, idx: number) => {
    setIndex(idx);
    setSelectedData(row);
    setOpen(true);
  };

  return (
    <>
      <div className="">
        <div className="mt-4 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Time
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Request
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Response
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Duration
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Token Count
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Log Prob
                      </th>
                      <th
                        scope="col"
                        className="whitespace-nowrap px-2 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        User
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
                      <tr key={row.request_id}>
                        <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                          {new Date(row.request_created_at!).toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-sm font-medium text-gray-900">
                          {row.request_body?.prompt
                            ? truncString(row.request_body.prompt, 15)
                            : "{{no prompt }}"}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-900">
                          {truncString(
                            row.response_body!.choices
                              ? row.response_body!.choices[0].text
                              : "{{ no reponse }}",
                            15
                          )}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                          {(
                            (new Date(row.response_created_at!).getTime() -
                              new Date(row.request_created_at!).getTime()) /
                            1000
                          ).toString()}{" "}
                          s
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                          {row.response_body!.usage
                            ? row.response_body!.usage.total_tokens
                            : "{{ no tokens found }}"}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                          {probabilities[idx]}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500">
                          {row.request_user_id &&
                            truncString(row.request_user_id, 5)}
                        </td>
                        <td className="relative whitespace-nowrap py-2 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            className="text-sky-600 hover:text-sky-900"
                            onClick={() => selectRowHandler(row, idx)}
                          >
                            View
                            <span className="sr-only">, {row.request_id}</span>
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
      {open && selectedData !== undefined && index !== undefined && (
        <ThemedModal open={open} setOpen={setOpen}>
          <div>
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
              <InformationCircleIcon
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
                <li className="w-full flex flex-row justify-between gap-2 text-sm">
                  <p>Time:</p>
                  <p>
                    {new Date(
                      selectedData.request_created_at!
                    ).toLocaleString()}
                  </p>
                </li>
                <li className="w-full flex flex-row justify-between gap-2 text-sm">
                  <p>Request:</p>
                  <p className="max-w-xl text-left">
                    {selectedData.request_body?.prompt
                      ? selectedData.request_body.prompt
                      : "{{no prompt }}"}
                  </p>
                </li>
                <li className="w-full flex flex-row justify-between gap-2 text-sm">
                  <p>Response:</p>
                  <p className="max-w-xl text-left">
                    {selectedData.response_body!.choices
                      ? selectedData.response_body!.choices[0].text
                      : "{{ no reponse }}"}
                  </p>
                </li>
                <li className="w-full flex flex-row justify-between gap-2 text-sm">
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
                <li className="w-full flex flex-row justify-between gap-2 text-sm">
                  <p>Tokens:</p>
                  <p>
                    {selectedData.response_body!.usage
                      ? selectedData.response_body!.usage.total_tokens
                      : "{{ no tokens found }}"}
                  </p>
                </li>
                <li className="w-full flex flex-row justify-between gap-2 text-sm">
                  <p>Log Probability:</p>
                  <p>{probabilities[index]}</p>
                </li>
                <li className="w-full flex flex-row justify-between gap-2 text-sm">
                  <p>User Id:</p>
                  <p>{selectedData.request_user_id}</p>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 w-full justify-between gap-4">
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
      )}
    </>
  );
}
