import { useEffect, useRef, useState } from "react";
import { usePlaygroundPage } from "../../../services/hooks/playground";
import AuthHeader from "../../shared/authHeader";
import { clsx } from "../../shared/clsx";
import ChatPlayground from "./chatPlayground";
import ThemedDropdown from "../../shared/themed/themedDropdown";
import LoadingAnimation from "../../shared/loadingAnimation";

interface PlaygroundPageProps {
  request?: string;
}

const PlaygroundPage = (props: PlaygroundPageProps) => {
  const { request } = props;
  const [requestId, setRequestId] = useState<string | undefined>(request);
  const [model, setModel] = useState<string>("gpt-3.5-turbo");
  const [temperature, setTemperature] = useState<number>(0.7);

  const { data, isLoading, chat, hasData, isChat } = usePlaygroundPage(
    requestId || ""
  );

  return (
    <div className="grid grid-cols-8 gap-8 h-full w-full">
      <div className="col-span-8 border-b border-gray-300 pb-4">
        <div className="max-w-lg">
          <label
            htmlFor="key-name"
            className="block text-md font-semibold leading-6 text-gray-900"
          >
            Request ID
          </label>
          <input
            type="text"
            name="request-id"
            id="request-id"
            onChange={(e) => setRequestId(e.target.value)}
            className={clsx(
              "mt-2 block w-full rounded-lg p-3 text-sm text-gray-900 shadow-sm border border-gray-300"
            )}
            placeholder="Enter in a Request ID"
            value={requestId}
          />
        </div>
      </div>
      {requestId === undefined ? (
        <div className="col-span-8 h-96 p-8 flex flex-col space-y-4 w-full border border-dashed border-gray-300 rounded-xl justify-center items-center text-center">
          <p className="text-2xl font-semibold text-gray-700">
            No Request Selected
          </p>
          <p className="text-gray-500">
            Please enter in a request ID to load it into the playground
          </p>
        </div>
      ) : isLoading ? (
        <div className="col-span-8 h-96 items-center justify-center flex flex-col border border-dashed border-gray-300 rounded-xl text-gray-500">
          Loading in request...
        </div>
      ) : hasData && isChat ? (
        <>
          <div className="col-span-8 lg:col-span-2 order-1 h-max bg-white w-full border border-gray-300 rounded-lg p-4 pb-8 space-y-8 lg:sticky lg:top-20">
            <ul className="text-sm divide-y divide-gray-300">
              {data.map((d, i) => (
                <li
                  key={i}
                  className="flex flex-row justify-between py-2 text-sm space-x-2"
                >
                  <span className="font-semibold text-gray-900 flex-1 w-full whitespace-nowrap">
                    {d.label}
                  </span>
                  <span className="text-gray-900 truncate">
                    {d.value?.toString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-span-8 lg:col-span-4 order-3 lg:order-2 relative">
            {isLoading ? (
              <div className="w-full border border-gray-300 rounded-lg bg-gray-200 h-96 animate-pulse" />
            ) : (
              <ChatPlayground
                requestId={requestId || ""}
                chat={chat}
                model={model}
                temperature={temperature}
              />
            )}
          </div>
          <div className="col-span-8 lg:col-span-2 order-2 lg:order-3 h-max bg-white w-full border border-gray-300 rounded-lg p-4 pb-8 space-y-8 lg:sticky lg:top-20">
            <div className="flex flex-col space-y-1.5">
              <p className="font-semibold text-sm text-gray-900">Model</p>
              <ThemedDropdown
                options={[
                  {
                    label: "gpt-3.5-turbo",
                    value: "gpt-3.5-turbo",
                  },
                ]}
                selectedValue={model}
                onSelect={() => {}}
                disabled
              />
            </div>
            <div className="flex flex-col space-y-1.5 w-full">
              <div className="flex flex-row w-full justify-between items-center">
                <label
                  htmlFor="temp"
                  className="font-semibold text-sm text-gray-900"
                >
                  Temperature
                </label>
                <input
                  type="number"
                  id="temp"
                  name="temp"
                  value={temperature}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (value < 0.01) {
                      setTemperature(0.01);
                      return;
                    }
                    if (value > 1) {
                      setTemperature(1);
                      return;
                    }
                    setTemperature(parseFloat(e.target.value));
                  }}
                  min={0}
                  max={1}
                  step={0.01}
                  className="w-16 text-sm px-2 py-1 rounded-lg border border-gray-300"
                />
              </div>
              <input
                type="range"
                id="temp-range"
                name="temp-range"
                min={0}
                max={1}
                step={0.01}
                value={temperature}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value < 0.01) {
                    setTemperature(0.01);
                    return;
                  }
                  if (value > 1) {
                    setTemperature(1);
                    return;
                  }
                  setTemperature(parseFloat(e.target.value));
                }}
                className=""
              />
            </div>
          </div>
        </>
      ) : !isChat ? (
        <div className="col-span-8 h-96 items-center justify-center flex flex-col border border-dashed border-gray-300 rounded-xl text-gray-500">
          This request is not a chat completion request. We do not currently
          support non-chat completion requests in playground
        </div>
      ) : (
        <div className="col-span-8 h-96 items-center justify-center flex flex-col border border-dashed border-gray-300 rounded-xl text-gray-500">
          No data found for this request. Please make sure the request is
          correct or try another request.
        </div>
      )}
    </div>
  );
};

export default PlaygroundPage;
