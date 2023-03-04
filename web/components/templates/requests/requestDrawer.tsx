import {
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import useNotification from "../../shared/notification/useNotification";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import ThemedModal from "../../shared/themed/themedModal";
import { Chat } from "./chat";
import { Completion } from "./completion";
import { CompletionRegex } from "./completionRegex";

interface RequestDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  request: {
    request_id: string | null;
    response_id: string | null;
    error?: any;
    time: string | null;
    request: string | undefined;
    response: string | undefined;
    "duration (s)": string;
    total_tokens: number | undefined;
    logprobs: any;
    request_user_id: string | null;
    model: string | undefined;
    temperature: number | undefined;
    [keys: string]: any;
  };
  probabilities: any[];
  index: number;
  properties: string[];
  values: string[];
}

const RequestDrawer = (props: RequestDrawerProps) => {
  const { open, setOpen, request, probabilities, index, properties, values } =
    props;

  const makePropertyRow = (name: string, val: string) => {
    return (
      <div className="flex justify-between py-2 text-xs font-medium">
        <dt className="text-gray-500">{name}</dt>
        <dd className="text-gray-900">{val || "{NULL}"}</dd>
      </div>
    );
  };

  return (
    <ThemedDrawer
      open={open}
      setOpen={setOpen}
      title="Request Information"
      copyData={JSON.stringify(request)}
    >
      <dl className="mt-2 divide-y divide-gray-200 border-b border-gray-200">
        <div className="flex justify-between py-2 text-xs font-medium">
          <dt className="text-gray-500">Time</dt>
          <dd className="text-gray-900">
            {new Date(request.time || "").toLocaleString()}
          </dd>
        </div>
        <div className="flex justify-between py-2 text-xs font-medium">
          <dt className="text-gray-500">User ID</dt>
          <dd className="text-gray-900">{request.request_user_id || "n/a"}</dd>
        </div>
        <div className="flex justify-between py-2 text-xs font-medium">
          <dt className="text-gray-500">Duration</dt>
          <dd className="text-gray-900">{request["duration (s)"]}s</dd>
        </div>
        <div className="flex justify-between py-2 text-xs font-medium">
          <dt className="text-gray-500">Model</dt>
          <dd className="text-gray-900">{request.model}</dd>
        </div>
        <div className="flex justify-between py-2 text-xs font-medium">
          <dt className="text-gray-500">Tokens</dt>
          <dd className="text-gray-900">{request.total_tokens}</dd>
        </div>
        <div className="flex justify-between py-2 text-xs font-medium">
          <dt className="text-gray-500">Log Probability</dt>
          <dd className="text-gray-900">
            {probabilities[index] ? (
              <p>{probabilities ? probabilities[index] : 0}</p>
            ) : (
              "n/a"
            )}
          </dd>
        </div>
        {properties
          .filter((v) => request[v] != null)
          .map((p) =>
            makePropertyRow(p, request[p] !== null ? request[p] : "{NULL}")
          )}
      </dl>
      {request.error && request.error != "unknown error" && (
        <div className="flex flex-col justify-between py-3 text-xs font-medium space-y-1">
          <dt className="text-gray-500">Error</dt>
          <dd className="text-gray-900 p-2 border border-gray-300 bg-gray-100 rounded-md">
            <pre className="whitespace-pre-wrap" style={{ fontSize: "0.7rem" }}>
              {request.error
                ? JSON.stringify(request.error, null, 2)
                : "{{ no error }}"}
            </pre>
          </dd>
        </div>
      )}
      <div className="mt-4">
        {request.isChat ? (
          <Chat chatProperties={request.chatProperties} />
        ) : !request.prompt_regex ? (
          <Completion request={request.request} response={request.response} />
        ) : (
          <CompletionRegex
            prompt_regex={request.prompt_regex}
            prompt_name={request.prompt_name}
            // keys is the values for all the keys in `values`
            keys={values.reduce((acc, key) => {
              if (request.hasOwnProperty(key)) {
                return {
                  ...acc,
                  [key]: request[key],
                };
              }
              return acc;
            }, {})}
            response={request.response}
            values={values}
          />
        )}
      </div>
    </ThemedDrawer>
  );
};

export default RequestDrawer;
