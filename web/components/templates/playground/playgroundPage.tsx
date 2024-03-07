import { useState } from "react";
import { usePlaygroundPage } from "../../../services/hooks/playground";
import { clsx } from "../../shared/clsx";
import ChatPlayground from "./chatPlayground";
import { useDebounce } from "../../../services/hooks/debounce";
import AuthHeader from "../../shared/authHeader";
import RequestDrawerV2 from "../requestsV2/requestDrawerV2";
import useNotification from "../../shared/notification/useNotification";
import {
  CodeBracketSquareIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { MultiSelect, MultiSelectItem } from "@tremor/react";
import ThemedModal from "../../shared/themed/themedModal";
import Image from "next/image";

interface PlaygroundPageProps {
  request?: string;
}

const PlaygroundPage = (props: PlaygroundPageProps) => {
  const { request } = props;
  const [requestId, setRequestId] = useState<string | undefined>(request);

  const [open, setOpen] = useState<boolean>(false);
  const [infoOpen, setInfoOpen] = useState<boolean>(false);

  const debouncedRequestId = useDebounce(requestId, 500);

  const { data, isLoading, chat, hasData, isChat } = usePlaygroundPage(
    debouncedRequestId || "",
  );

  const singleRequest = data.length > 0 ? data[0] : null;

  const reqBody =
    singleRequest !== null ? (singleRequest.requestBody as any) : null;

  const [selectedModels, setSelectedModels] = useState<string[]>(
    singleRequest !== null ? [singleRequest.model] : [],
  );
  const [temperature, setTemperature] = useState<number>(
    reqBody !== null ? reqBody.temperature : 0.7,
  );
  const [maxTokens, setMaxTokens] = useState<number>(
    reqBody !== null ? reqBody.max_tokens : 256,
  );

  const { setNotification } = useNotification();

  return (
    <>
      <AuthHeader
        title={"Playground"}
        actions={
          <div id="toolbar" className="flex flex-row items-center gap-2 w-full">
            <input
              type="text"
              name="request-id"
              id="request-id"
              onChange={(e) => setRequestId(e.target.value)}
              className={clsx(
                "block w-[22rem] rounded-lg px-4 py-2 text-sm text-gray-900 bg-white shadow-sm border border-gray-300 dark:bg-black dark:text-gray-100 dark:border-gray-700",
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
                "bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2",
              )}
            >
              <CodeBracketSquareIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
                View Source
              </p>
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-8 gap-8 h-full w-full pt-4">
        {requestId === undefined || requestId === "" ? (
          <div className="col-span-8 h-96 p-8 flex flex-col space-y-4 w-full border border-dashed border-gray-300 rounded-xl justify-center items-center text-center">
            <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
              No Request Selected
            </p>
            <p className="text-gray-500">
              Please enter in a request ID to load it into the playground
            </p>
          </div>
        ) : isLoading ? (
          <div className="col-span-8 flex w-full border border-gray-300 rounded-lg bg-gray-200 h-96 animate-pulse" />
        ) : hasData && isChat && singleRequest !== null ? (
          <>
            <div className="col-span-8">
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="order-2 sm:order-1 flex w-full">
                  <ChatPlayground
                    requestId={requestId || ""}
                    chat={chat}
                    models={selectedModels}
                    temperature={temperature}
                    maxTokens={maxTokens}
                  />
                </div>
                <div className="flex flex-col space-y-8 w-full sm:max-w-[15rem] order-1 sm:order-2 relative">
                  <div className="h-fit sticky top-8 flex flex-col space-y-8">
                    <div className="flex flex-col space-y-2 w-full">
                      <div className="flex flex-row w-full space-x-1 items-center">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                          Models
                        </p>
                        <button
                          onClick={() => {
                            setInfoOpen(true);
                          }}
                          className="hover:cursor-pointer"
                        >
                          <InformationCircleIcon className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>

                      <MultiSelect
                        placeholder="Select your models..."
                        value={selectedModels}
                        onValueChange={(values: string[]) => {
                          setSelectedModels(values);
                        }}
                        className="border border-gray-500 rounded-lg"
                      >
                        {[
                          "gpt-3.5-turbo",
                          "gpt-3.5-turbo-0613",
                          "gpt-3.5-turbo-16k",
                          "gpt-3.5-turbo-1106",
                          "gpt-4",
                          "gpt-4-0613",
                          "gpt-4-32k",
                          "gpt-4-1106-preview",
                          "gpt-4-vision-preview",
                        ].map((model, idx) => (
                          <MultiSelectItem
                            value={model}
                            key={idx}
                            className="font-medium text-black"
                          >
                            {model}
                          </MultiSelectItem>
                        ))}
                      </MultiSelect>
                    </div>
                    <div className="flex flex-col space-y-3 w-full">
                      <div className="flex flex-row w-full justify-between items-center">
                        <label
                          htmlFor="temp"
                          className="font-semibold text-sm text-gray-900 dark:text-gray-100"
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
                            if (value < 0) setTemperature(0);
                            else if (value > 1.99) setTemperature(1.99);
                            else setTemperature(value);
                          }}
                          min={0}
                          max={1.99}
                          step={0.01}
                          className="w-16 text-sm px-2 py-1 rounded-lg border border-gray-500"
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
                          if (value < 0) setTemperature(0);
                          else if (value > 1.99) setTemperature(1.99);
                          else setTemperature(value);
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
                          className="font-semibold text-sm text-gray-900 dark:text-gray-100"
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
                              setMaxTokens(1);
                              return;
                            }
                            if (value > 2048) {
                              setMaxTokens(2048);
                              return;
                            }
                            setMaxTokens(parseFloat(e.target.value));
                          }}
                          min={1}
                          max={2048}
                          step={1}
                          className="w-16 text-sm px-2 py-1 rounded-lg border border-gray-500"
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
                            setMaxTokens(1);
                            return;
                          }
                          if (value > 2048) {
                            setMaxTokens(2048);
                            return;
                          }
                          setMaxTokens(parseFloat(e.target.value));
                        }}
                        style={{
                          accentColor: "black",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : !isChat ? (
          <div className="col-span-8 h-96 items-center justify-center flex flex-col border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500">
            This request is not a chat completion request. We do not currently
            support non-chat completion requests in playground
          </div>
        ) : (
          <div className="col-span-8 h-96 items-center justify-center flex flex-col border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500">
            No data found for this request. Please make sure the request is
            correct or try another request.
          </div>
        )}
      </div>
      <ThemedModal open={infoOpen} setOpen={setInfoOpen}>
        <div className="w-[450px] flex flex-col space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Experiment with Models
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Easily experiment with different models and parameters to see how
            they affect your chats. Different experiments will{" "}
            <span className="font-semibold italic">use the same model</span> for
            the entire conversation.
          </p>
          <div className="flex justify-center">
            <Image
              src={"/assets/playground/playground-graphic.png"}
              height={400}
              width={300}
              alt={"playground-graphic"}
            />
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            For the experiments above, the conversation for{" "}
            <span className="font-semibold italic">gpt-3.5-turbo</span> will
            take the flow: A - B - D - E
          </p>
        </div>
      </ThemedModal>
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
