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
}

const RequestDrawer = (props: RequestDrawerProps) => {
  const { open, setOpen, wrappedRequest, values } = props;

  const makePropertyRow = (name: string, val: string) => {
    return (
      <div className="flex justify-between py-2 text-xs font-medium">
        <dt className="text-gray-500">{name}</dt>
        <dd className="text-gray-900">{val || "{NULL}"}</dd>
      </div>
    );
  };

  const getLogProbs = () => {
    if (wrappedRequest.gpt3 && wrappedRequest.gpt3.responseBody.choices) {
      const choice = wrappedRequest.gpt3.responseBody.choices[0];
      if (choice && choice.logProbs) {
        const sum = choice.logProbs.tokenLogProbs.reduce(
          (total: any, num: any) => total + num
        );
        return sum.toFixed(2);
      }
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
          <dd className="text-gray-900">
            {wrappedRequest.gpt3
              ? wrappedRequest.gpt3.requestBody.model
              : wrappedRequest.chat?.requestBody.model}
          </dd>
        </div>
        <div className="flex justify-between py-2 text-xs font-medium">
          <dt className="text-gray-500">Tokens</dt>
          <dd className="text-gray-900">
            {wrappedRequest.gpt3
              ? wrappedRequest.gpt3.responseBody.usage.totalTokens
              : wrappedRequest.chat?.responseBody.usage.totalTokens}
          </dd>
        </div>
        <div className="flex justify-between py-2 text-xs font-medium">
          <dt className="text-gray-500">Log Probability</dt>
          <dd className="text-gray-900">{getLogProbs()}</dd>
        </div>
      </dl>
      {/* {wrappedRequest. && request.error != "unknown error" && (
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
      )} */}
      <div className="mt-4">
        {wrappedRequest.chat ? (
          <Chat
            chatProperties={{
              request: wrappedRequest.chat.requestBody.messages,
              response:
                wrappedRequest.chat.responseBody.choices[0]?.message || "error",
            }}
          />
        ) : wrappedRequest.promptRegex === "n/a" ? (
          <Completion
            request={wrappedRequest.gpt3?.requestBody.prompt}
            response={
              wrappedRequest.gpt3?.responseBody.choices[0]?.text || "error"
            }
          />
        ) : (
          <h1>hello Regex</h1>
          // <CompletionRegex
          //   prompt_regex={wrappedRequest.promptRegex}
          //   prompt_name={wrappedRequest.promptName}
          //   // keys is the values for all the keys in `values`
          //   keys={values.reduce((acc, key) => {
          //     if (request.hasOwnProperty(key)) {
          //       return {
          //         ...acc,
          //         [key]: wrappedRequest[key],
          //       };
          //     }
          //     return acc;
          //   }, {})}
          //   response={request.response}
          //   values={values}
          // />
        )}
      </div>
    </ThemedDrawer>
  );
};

export default RequestDrawer;
