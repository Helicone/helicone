import {
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { request } from "https";
import { wrap } from "module";
import { useGetRequestMetaData } from "../../../services/hooks/requestMetaData";
import useNotification from "../../shared/notification/useNotification";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import ThemedModal from "../../shared/themed/themedModal";
import { CacheHits } from "./cacheHits";
import { Chat } from "./chat";
import { Completion } from "./completion";
import { CompletionRegex } from "./completionRegex";
import Moderation from "./moderation";
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
  const { metaData: requestMetaData } = useGetRequestMetaData(
    wrappedRequest.id
  );

  const makePropertyRow = (name: string, val: string | undefined) => {
    if (val === undefined) return null;
    return (
      <div className="flex flex-col justify-between py-2 text-xs font-medium col-span-1 border-b border-gray-200">
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
      copyData={JSON.stringify(wrappedRequest, null, 2)}
    >
      <dl className="mt-2 grid grid-cols-2">
        <div className="flex flex-col justify-between py-2 text-xs font-medium col-span-1 border-b border-gray-200">
          <dt className="text-gray-500">Time</dt>
          <dd className="text-gray-900">
            {new Date(wrappedRequest.requestCreatedAt).toLocaleString()}
          </dd>
        </div>
        <div className="flex flex-col justify-between py-2 text-xs font-medium col-span-1 border-b border-gray-200">
          <dt className="text-gray-500">User ID</dt>
          <dd className="text-gray-900">{wrappedRequest.userId || "n/a"}</dd>
        </div>
        <div className="flex flex-col justify-between py-2 text-xs font-medium col-span-1 border-b border-gray-200">
          <dt className="text-gray-500">Duration</dt>
          <dd className="text-gray-900">{wrappedRequest.latency}s</dd>
        </div>
        <div className="flex flex-col justify-between py-2 text-xs font-medium col-span-1 border-b border-gray-200">
          <dt className="text-gray-500">Model</dt>
          <dd className="text-gray-900">{wrappedRequest.model}</dd>
        </div>
        <div className="flex flex-col justify-between py-2 text-xs font-medium col-span-1 border-b border-gray-200">
          <dt className="text-gray-500">Tokens</dt>
          <dd className="text-gray-900">{wrappedRequest.totalTokens}</dd>
        </div>
        <div className="flex flex-col justify-between py-2 text-xs font-medium col-span-1 border-b border-gray-200">
          <dt className="text-gray-500">Log Probability</dt>
          <dd className="text-gray-900">
            {wrappedRequest.logProbs
              ? wrappedRequest.logProbs.toFixed(2)
              : "n/a"}
          </dd>
        </div>
        {properties !== undefined &&
          properties.map((property) => {
            return makePropertyRow(
              property,
              (wrappedRequest[property] as string) || undefined
            );
          })}
      </dl>
      <CacheHits metadata={requestMetaData} />
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
        ) : wrappedRequest.api.moderation ? (
          <Moderation
            request={wrappedRequest.api.moderation.request}
            response={wrappedRequest.api.moderation.results}
          />
        ) : wrappedRequest.promptRegex === "" ? (
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
