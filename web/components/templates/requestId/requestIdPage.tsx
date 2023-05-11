import { useState } from "react";
import { capitalizeWords } from "../../shared/utils/utils";
import { Chat } from "../requests/chat";
import { Completion } from "../requests/completion";
import { CompletionRegex } from "../requests/completionRegex";
import Moderation from "../requests/moderation";
import useRequestsPage from "../requests/useRequestsPage";

interface RequestIdPageProps {
  requestId: string;
}

const RequestIdPage = (props: RequestIdPageProps) => {
  const { requestId } = props;

  const {
    count,
    values,
    from,
    isLoading,
    isPropertiesLoading,
    isValuesLoading,
    properties,
    refetch,
    filterMap,
    requests,
    to,
    searchPropertyFilters,
  } = useRequestsPage(
    1,
    1,
    [],
    {
      request: {
        id: {
          equals: requestId,
        },
      },
    },
    {}
  );

  const makePropertyRow = (name: string, val: string | undefined) => {
    if (val === undefined) return null;
    return (
      <div className="col-span-1 flex flex-row justify-between py-2 items-center text-sm font-medium border-b border-gray-200">
        <dt className="text-gray-500">{capitalizeWords(name)}</dt>
        <dd className="text-gray-900">{val || "{NULL}"}</dd>
      </div>
    );
  };

  console.log(requests);

  const wrappedRequest = requests[0];

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="flex flex-col md:flex-row gap-8 py-4">
      <div className="flex flex-col space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 w-full md:w-[400px] space-y-4">
          <p className="text-md text-gray-900 font-medium">Request Data</p>
          <dl className="mt-2 grid grid-cols-1">
            <div className="col-span-1 flex flex-row justify-between py-2 items-center text-sm font-medium border-b border-gray-200">
              <dt className="text-gray-500 font-medium">ID</dt>
              <dd className="text-gray-900">{wrappedRequest.id}</dd>
            </div>
            <div className="flex flex-row justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200">
              <dt className="text-gray-500 font-medium">Time</dt>
              <dd className="text-gray-900">
                {new Date(wrappedRequest.requestCreatedAt).toLocaleString()}
              </dd>
            </div>
            <div className="flex flex-row justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200">
              <dt className="text-gray-500">User ID</dt>
              <dd className="text-gray-900">
                {wrappedRequest.userId || "n/a"}
              </dd>
            </div>
            <div className="flex flex-row justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200">
              <dt className="text-gray-500">Duration</dt>
              <dd className="text-gray-900">{wrappedRequest.latency}s</dd>
            </div>
            <div className="flex flex-row justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200">
              <dt className="text-gray-500">Model</dt>
              <dd className="text-gray-900">{wrappedRequest.model}</dd>
            </div>
            <div className="flex flex-row justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200">
              <dt className="text-gray-500">Tokens</dt>
              <dd className="text-gray-900">{wrappedRequest.totalTokens}</dd>
            </div>
            <div className="flex flex-row justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200">
              <dt className="text-gray-500">Log Probability</dt>
              <dd className="text-gray-900">
                {wrappedRequest.logProbs
                  ? wrappedRequest.logProbs.toFixed(2)
                  : "n/a"}
              </dd>
            </div>
            <div className="flex flex-row justify-between py-2 text-sm font-medium col-span-1 border-b border-gray-200">
              <dt className="text-gray-500">Key Name</dt>
              <dd className="text-gray-900">{wrappedRequest.keyName}</dd>
            </div>
          </dl>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 w-full md:w-[400px] space-y-4">
          <p className="text-md text-gray-900 font-medium">Custom Properties</p>
          <dl className="mt-2 grid grid-cols-1">
            {properties !== undefined &&
              properties.map((property) => {
                return makePropertyRow(
                  property,
                  (wrappedRequest[property] as string) || undefined
                );
              })}
          </dl>
        </div>
      </div>
      <div className="flex flex-col px-4 w-full flex-1 max-w-7xl">
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
      </div>
    </div>
  );
};

export default RequestIdPage;
