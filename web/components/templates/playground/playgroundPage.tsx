import { useEffect, useRef, useState } from "react";
import { usePlaygroundPage } from "../../../services/hooks/playground";
import { clsx } from "../../shared/clsx";
import ChatPlayground from "./chatPlayground";
import ThemedDropdown from "../../shared/themed/themedDropdown";
import { useDebounce } from "../../../services/hooks/debounce";
import AuthHeader from "../../shared/authHeader";
import RequestDrawerV2 from "../requestsV2/requestDrawerV2";
import useNotification from "../../shared/notification/useNotification";
import {
  CodeBracketSquareIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";

interface PlaygroundPageProps {
  request?: string;
}

const PlaygroundPage = (props: PlaygroundPageProps) => {
  const { request } = props;
  const [requestId, setRequestId] = useState<string | undefined>(request);
  const [model, setModel] = useState<string>("gpt-3.5-turbo");
  const [temperature, setTemperature] = useState<number>(1);
  const [maxTokens, setMaxTokens] = useState<number>(256);
  const [open, setOpen] = useState<boolean>(false);

  const debouncedRequestId = useDebounce(requestId, 500);

  const { data, isLoading, chat, hasData, isChat } = usePlaygroundPage(
    debouncedRequestId || ""
  );
  const { setNotification } = useNotification();

  const singleRequest = data.length > 0 ? data[0] : null;

  return (
    <>
      <AuthHeader
        title={"Playground"}
        actions={
          <div id="toolbar" className="flex flex-row items-center gap-3 w-full">
            <input
              type="text"
              name="request-id"
              id="request-id"
              onChange={(e) => setRequestId(e.target.value)}
              className={clsx(
                "block w-[22rem] rounded-lg px-3 py-1.5 text-sm text-gray-900 shadow-sm border border-gray-300"
              )}
              placeholder="Enter in a Request ID"
              value={requestId}
            />
            <button
              disabled={singleRequest === null}
              onClick={() => {
                if (singleRequest === null) {
                  setNotification("Invalid Request", "error");
                  return;
                }
                setOpen(true);
              }}
              className={clsx(
                singleRequest === null ? "opacity-50" : "",
                "bg-white border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-sky-50 flex flex-row items-center gap-2"
              )}
            >
              <CodeBracketSquareIcon className="h-5 w-5 text-gray-900" />
              <p className="text-sm font-medium text-gray-900 hidden sm:block">
                View Source
              </p>
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-8 gap-8 h-full w-full pt-4">
        {requestId === undefined || requestId === "" ? (
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
        ) : hasData && isChat && singleRequest !== null ? (
          <>
            <div className="col-span-8">
              {isLoading ? (
                <div className="w-full border border-gray-300 rounded-lg bg-gray-200 h-96 animate-pulse" />
              ) : (
                <div className="flex flex-col sm:flex-row gap-8">
                  <div className="order-2 sm:order-1 flex w-full">
                    <ChatPlayground
                      requestId={requestId || ""}
                      chat={chat}
                      model={model}
                      temperature={temperature}
                    />
                  </div>
                  <div className="flex flex-col space-y-8 w-full sm:max-w-[15rem] order-1 sm:order-2">
                    <div className="flex flex-col space-y-2 w-full">
                      <div className="flex flex-row w-full justify-between items-center">
                        <p className="font-semibold text-sm text-gray-900">
                          Model
                        </p>
                        <Tooltip
                          title="Experiment between different models"
                          placement="left"
                        >
                          <button
                            onClick={() => {}}
                            className="hover:bg-gray-200 rounded-lg p-1 -m-1"
                          >
                            <PlusCircleIcon className="h-5 w-5 text-gray-900" />
                          </button>
                        </Tooltip>
                      </div>

                      <ThemedDropdown
                        options={[
                          {
                            label: "gpt-3.5-turbo",
                            value: "gpt-3.5-turbo",
                          },
                          {
                            label: "gpt-3.5-turbo-0613",
                            value: "gpt-3.5-turbo-0613",
                          },
                          {
                            label: "gpt-3.5-turbo-16k",
                            value: "gpt-3.5-turbo-16k",
                          },
                          {
                            label: "gpt-4",
                            value: "gpt-4",
                          },
                          {
                            label: "gpt-4-0613",
                            value: "gpt-4-0613",
                          },
                          {
                            label: "gpt-4-32k",
                            value: "gpt-4-32k",
                          },
                        ]}
                        selectedValue={model}
                        onSelect={(option) => {
                          setModel(option);
                        }}
                      />
                    </div>
                    <div className="flex flex-col space-y-3 w-full">
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
                            if (value > 1.99) {
                              setTemperature(1.99);
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
                        max={1.99}
                        step={0.01}
                        value={temperature}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value < 0.01) {
                            setTemperature(0.01);
                            return;
                          }
                          if (value > 1.99) {
                            setTemperature(1.99);
                            return;
                          }
                          setTemperature(parseFloat(e.target.value));
                        }}
                        className="text-black"
                        style={{
                          accentColor: "black",
                        }}
                      />
                    </div>
                    <div className="flex flex-col space-y-3 w-full">
                      <div className="flex flex-row w-full justify-between items-center">
                        <label
                          htmlFor="tokens"
                          className="font-semibold text-sm text-gray-900"
                        >
                          Max Tokens
                        </label>
                        <input
                          type="number"
                          id="tokens"
                          name="tokens"
                          value={maxTokens}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (value < 1) {
                              setTemperature(1);
                              return;
                            }
                            if (value > 2048) {
                              setTemperature(2048);
                              return;
                            }
                            setTemperature(parseFloat(e.target.value));
                          }}
                          min={1}
                          max={2048}
                          step={1}
                          className="w-16 text-sm px-2 py-1 rounded-lg border border-gray-300"
                        />
                      </div>
                      <input
                        type="range"
                        id="token-range"
                        name="token-range"
                        min={1}
                        max={2048}
                        step={1}
                        value={maxTokens}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value < 1) {
                            setTemperature(1);
                            return;
                          }
                          if (value > 2048) {
                            setTemperature(2048);
                            return;
                          }
                          setTemperature(parseFloat(e.target.value));
                        }}
                        style={{
                          accentColor: "black",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
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
      {singleRequest !== null && (
        <RequestDrawerV2
          open={open}
          setOpen={setOpen}
          request={singleRequest}
          properties={[]}
        />
      )}
    </>
  );
};

export default PlaygroundPage;
