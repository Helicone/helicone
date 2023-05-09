import {
  ArrowsPointingOutIcon,
  BeakerIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentListIcon,
  ClipboardIcon,
  CodeBracketIcon,
  EyeIcon,
  Square3Stack3DIcon,
} from "@heroicons/react/24/outline";
import { wrap } from "module";
import { useRouter } from "next/router";
import { useState } from "react";
import { middleTruncString } from "../../../lib/stringHelpers";
import { useGetRequestMetaData } from "../../../services/hooks/requestMetaData";
import useNotification from "../../shared/notification/useNotification";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import ThemedToggle from "../../shared/themed/themedTabs";
import { capitalizeWords } from "../../shared/utils/utils";
import { CacheHits } from "./cacheHits";
import { Chat } from "./chat";
import { Completion } from "./completion";
import { CompletionRegex } from "./completionRegex";
import Moderation from "./moderation";
import { RequestWrapper } from "./useRequestsPage";

interface RequestDrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  values: string[];
  wrappedRequest?: RequestWrapper;
  properties?: string[];
}

const RequestDrawer = (props: RequestDrawerProps) => {
  const { open, setOpen, wrappedRequest, values, properties } = props;
  const { metaData: requestMetaData, isLoading } = useGetRequestMetaData(
    wrappedRequest?.id || ""
  );
  const router = useRouter();
  const { setNotification } = useNotification();
  const [viewMode, setViewMode] = useState<"Pretty" | "JSON">("Pretty");

  const makePropertyRow = (name: string, val: string | undefined) => {
    if (val === undefined) return null;
    return (
      <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200">
        <dt className="text-gray-500">{capitalizeWords(name)}</dt>
        <dd className="text-gray-900">{val || "{NULL}"}</dd>
      </div>
    );
  };

  return (
    <ThemedDrawer
      open={open}
      setOpen={setOpen}
      title="Request"
      actions={
        <div className="flex flex-row items-center space-x-4">
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                JSON.stringify(wrappedRequest, null, 2)
              );
              setNotification("Copied to clipboard", "success");
            }}
            className="bg-gray-200 flex space-x-1 rounded-lg shadow-sm w-full flex-row px-3 py-2 text-sm font-medium leading-5 items-center"
          >
            <ClipboardDocumentListIcon className="h-5 w-5" />
            <p>Copy</p>
          </button>
          <button
            onClick={() => {
              router.push("/requests/" + wrappedRequest?.id);
            }}
            className="bg-gray-200 flex space-x-1 rounded-lg shadow-sm w-full flex-row px-3 py-2 text-sm font-medium leading-5 items-center"
          >
            <BeakerIcon className="h-5 w-5" />
            <p>Playground</p>
          </button>
        </div>
      }
    >
      {wrappedRequest === undefined ? (
        <p>Loading...</p>
      ) : (
        <div className="flex flex-col space-y-2">
          <dl className="mt-2 grid grid-cols-2">
            <div className="col-span-2 flex flex-row justify-between py-2 items-center text-sm font-medium border-b border-gray-200">
              <div className="flex flex-col">
                <dt className="text-gray-500">Request ID</dt>
                <dd className="text-gray-900">{wrappedRequest.id}</dd>
              </div>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200">
              <dt className="text-gray-500">Time</dt>
              <dd className="text-gray-900">
                {new Date(wrappedRequest.requestCreatedAt).toLocaleString()}
              </dd>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200">
              <dt className="text-gray-500">User ID</dt>
              <dd className="text-gray-900">
                {wrappedRequest.userId || "n/a"}
              </dd>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200">
              <dt className="text-gray-500">Duration</dt>
              <dd className="text-gray-900">{wrappedRequest.latency}s</dd>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200">
              <dt className="text-gray-500">Model</dt>
              <dd className="text-gray-900">{wrappedRequest.model}</dd>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200">
              <dt className="text-gray-500">Tokens</dt>
              <dd className="text-gray-900">{wrappedRequest.totalTokens}</dd>
            </div>
            <div className="flex flex-col justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200">
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
          {!isLoading && requestMetaData.length > 0 && (
            <CacheHits metadata={requestMetaData} />
          )}

          {wrappedRequest.error && (
            <div className="flex flex-col justify-between text-sm font-medium space-y-1">
              <dt className="text-gray-500">Error</dt>
              <dd className="text-gray-900 p-2 border border-gray-300 bg-gray-100 rounded-md">
                <pre
                  className="whitespace-pre-wrap"
                  style={{ fontSize: "0.7rem" }}
                >
                  {wrappedRequest.error
                    ? JSON.stringify(wrappedRequest.error, null, 2)
                    : "{{ no error }}"}
                </pre>
              </dd>
            </div>
          )}
          <div className="flex-col pt-8">
            <div className="flex flex-row justify-end w-full">
              <ThemedToggle
                options={[
                  {
                    label: "Pretty",
                    icon: EyeIcon,
                  },
                  {
                    label: "JSON",
                    icon: CodeBracketIcon,
                  },
                ]}
                onOptionSelect={(option) =>
                  setViewMode(option as "Pretty" | "JSON")
                }
              />
            </div>
            {viewMode === "Pretty" ? (
              <>
                {wrappedRequest.api.chat ? (
                  <Chat
                    chatProperties={{
                      request: wrappedRequest.api.chat.request,
                      response: wrappedRequest.api.chat.response,
                    }}
                    prompt_regex={wrappedRequest.promptRegex}
                    keys={values.reduce((acc, key) => {
                      if (wrappedRequest.hasOwnProperty(key)) {
                        return {
                          ...acc,
                          [key]: wrappedRequest[key],
                        };
                      }
                      return acc;
                    }, {})}
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
                      const promptValues = wrappedRequest.promptValues;
                      if (promptValues && promptValues.hasOwnProperty(key)) {
                        return {
                          ...acc,
                          [key]: promptValues[key],
                        };
                      }
                      return acc;
                    }, {})}
                    response={wrappedRequest.responseText}
                    values={values}
                  />
                )}
              </>
            ) : (
              <Completion
                request={JSON.stringify(wrappedRequest.requestBody, null, 4)}
                response={JSON.stringify(wrappedRequest.responseBody, null, 4)}
              />
            )}
          </div>
        </div>
      )}
    </ThemedDrawer>
  );
};

export default RequestDrawer;
