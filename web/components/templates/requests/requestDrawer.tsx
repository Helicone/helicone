import {
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { request } from "https";
import { wrap } from "module";
import useNotification from "../../shared/notification/useNotification";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import ThemedModal from "../../shared/themed/themedModal";
import { Chat } from "./chat";
import { Completion } from "./completion";
import { CompletionRegex } from "./completionRegex";
import { RequestWrapper } from "./useRequestsPage";

interface RequestDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  wrappedRequest: RequestWrapper;
  values: string[];
  properties?: string[];
}

const RequestDrawer = (props: RequestDrawerProps) => {
  const { open, setOpen, wrappedRequest, values, properties } = props;

  const makePropertyRow = (name: string, val: string | undefined) => {
    if (val === undefined) return null;
    return (
      <div className="flex justify-between py-2 text-xs font-medium">
        <dt className="text-gray-500">{name}</dt>
        <dd className="text-gray-900">{val || "{NULL}"}</dd>
      </div>
    );
  };

  const getLogProbs = () => {
    if (wrappedRequest.api.gpt3 && wrappedRequest.logProbs) {
      const sum = wrappedRequest.logProbs.reduce(
        (total: any, num: any) => total + num
      );
      return sum.toFixed(2);
    }
    return "n/a";
  };

  return (
    <ThemedDrawer
      open={open}
      setOpen={setOpen}
      title="Request Information"
      copyData={JSON.stringify(wrappedRequest, null, 2)}
    >
      <dl className="mt-2 divide-y divide-gray-200 border-b border-gray-200">
        <div className="flex justify-between py-2 text-xs font-medium">
          <dt className="text-gray-500">Time</dt>
          <dd className="text-gray-900">
            {new Date(wrappedRequest.requestCreatedAt).toLocaleString()}
          </dd>
        </div>
        <div className="flex justify-between py-2 text-xs font-medium">
          <dt className="text-gray-500">User ID</dt>
          <dd className="text-gray-900">{wrappedRequest.userId || "n/a"}</dd>
        </div>
        <div className="flex justify-between py-2 text-xs font-medium">
          <dt className="text-gray-500">Duration</dt>
          <dd className="text-gray-900">{wrappedRequest.latency}</dd>
        </div>
        <div className="flex justify-between py-2 text-xs font-medium">
          <dt className="text-gray-500">Model</dt>
          <dd className="text-gray-900">{wrappedRequest.requestModel}</dd>
        </div>
        <div className="flex justify-between py-2 text-xs font-medium">
          <dt className="text-gray-500">Tokens</dt>
          <dd className="text-gray-900">{wrappedRequest.totalTokens}</dd>
        </div>
        <div className="flex justify-between py-2 text-xs font-medium">
          <dt className="text-gray-500">Log Probability</dt>
          <dd className="text-gray-900">{getLogProbs()}</dd>
        </div>
        {properties !== undefined &&
          properties.map((property) => {
            return makePropertyRow(
              property,
              (wrappedRequest[property] as string) || undefined
            );
          })}
      </dl>
      {wrappedRequest.error && (
        <div className="flex flex-col justify-between py-3 text-xs font-medium space-y-1">
          <dt className="text-gray-500">Error</dt>
          <dd className="text-gray-900 p-2 border border-gray-300 bg-gray-100 rounded-md">
            <pre className="whitespace-pre-wrap" style={{ fontSize: "0.7rem" }}>
              {wrappedRequest.error
                ? JSON.stringify(wrappedRequest.error, null, 2)
                : "{{ no error }}"}
            </pre>
          </dd>
        </div>
      )}
      <div className="mt-4">
        {wrappedRequest.api.chat ? (
          <Chat
            chatProperties={{
              request: wrappedRequest.api.chat.request,
              response: wrappedRequest.api.chat.response,
            }}
          />
        ) : wrappedRequest.promptRegex === "n/a" ? (
          <Completion
            request={wrappedRequest.api.gpt3?.request}
            response={wrappedRequest.api.gpt3?.response}
          />
        ) : (
          <CompletionRegex
            prompt_regex={wrappedRequest.promptRegex}
            prompt_name={wrappedRequest.promptName}
            // keys is the values for all the keys in `values`
            keys={values.reduce((acc, key) => {
              if (request.hasOwnProperty(key)) {
                return {
                  ...acc,
                  [key]: wrappedRequest[key],
                };
              }
              return acc;
            }, {})}
            response={wrappedRequest.responseText}
            values={values}
          />
        )}
      </div>
    </ThemedDrawer>
  );
};

export default RequestDrawer;
