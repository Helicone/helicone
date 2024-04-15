import { MultiSelect, MultiSelectItem, NumberInput } from "@tremor/react";
import AuthHeader from "../../shared/authHeader";
import { MODEL_LIST } from "./new/modelList";
import { Disclosure } from "@headlessui/react";
import { ChevronRightIcon, PlusIcon } from "@heroicons/react/20/solid";
import { clsx } from "../../shared/clsx";
import ModelPill from "../requestsV2/modelPill";
import { useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import MessageInput, { MessageInputItem } from "./new/messageInput";
import useNotification from "../../shared/notification/useNotification";
import { fetchOpenAI } from "../../../services/lib/openAI";
import { ChatCompletionCreateParams } from "openai/resources";

interface PlaygroundV2Props {}

const PlaygroundV2 = (props: PlaygroundV2Props) => {
  const {} = props;

  const [threads, setThreads] = useState<
    {
      id: string;
      model: string;
      messages: MessageInputItem[];
    }[]
  >([
    {
      id: "1",
      model: "gpt-3.5-turbo",
      messages: [
        {
          id: "1",
          role: "system",
          content: "You are a helpful assistant",
          shared: true,
        },
        {
          id: "2",
          role: "user",
          content: "hello",
          shared: true,
        },
        {
          id: "3",
          role: "assistant",
          content: "hello. how can i help you?",
          shared: true,
        },
      ],
    },
    {
      id: "2",
      model: "gpt-4",
      messages: [
        {
          id: "1",
          role: "system",
          content: "You are a helpful assistant",
          shared: true,
        },
        {
          id: "2",
          role: "user",
          content: "hello",
          shared: true,
        },
        {
          id: "3",
          role: "assistant",
          content: "hello. how can i help you?",
          shared: true,
        },
      ],
    },
  ]);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [currentChatMessage, setCurrentChatMessage] =
    useState<MessageInputItem>({
      id: "4",
      role: "user",
      content: "",
    });

  const { setNotification } = useNotification();

  const handleSubmit = async () => {
    console.log("submit", threads);
    if (currentChatMessage.content === "") {
      setNotification("Message cannot be empty", "error");
      return;
    }

    setIsLoading(true);

    // add the current chat message to all threads and then clear the current chat message
    setThreads((prevThreads) => {
      return prevThreads.map((thread) => {
        return {
          ...thread,
          messages: [
            ...thread.messages,
            {
              id: crypto.randomUUID(),
              role: currentChatMessage.role,
              content: currentChatMessage.content,
            },
          ],
        };
      });
    });

    // remove the id from the currentChatMessage
    const currentChatWithoutId = {
      role: currentChatMessage.role,
      content: currentChatMessage.content,
    };

    const responses = await Promise.all(
      threads.map(async (thread) => {
        // prepare the messages in the thread to be compatible with the OpenAI API
        // for all the messageInputItems, remove the id
        const history = [...thread.messages, currentChatWithoutId].map(
          (message) => ({
            content: message.content,
            role: message.role,
          })
        );

        // Record the start time
        const startTime = new Date().getTime();

        // Perform the OpenAI request
        const { data, error } = await fetchOpenAI(
          history as unknown as ChatCompletionCreateParams[],
          temperature,
          thread.model,
          1024,
          undefined
        );

        // Record the end time and calculate latency
        const endTime = new Date().getTime();
        const latency = endTime - startTime; // Latency in milliseconds

        // Return the model, data, error, and latency
        return {
          threadId: thread.id,
          data,
          error,
          latency,
        };
      })
    ).finally(() => {
      setIsLoading(false);
      setCurrentChatMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: "",
      });
    });

    // append the responses to their respective threads
    setThreads((prevThreads) => {
      return prevThreads.map((prevThread) => {
        const response = responses.find(
          (response) => response.threadId === prevThread.id
        );
        return {
          ...prevThread,
          messages: [
            ...prevThread.messages,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content:
                response?.data?.choices[0].message.content ||
                "ERROR: failed to fetch response. Please try again`",
            },
          ],
        };
      });
    });
  };

  return (
    <div className="w-full h-full">
      <AuthHeader title={"Playground"} />
      <div className="min-h-[85vh] w-full bg-white flex border border-gray-300 rounded-lg relative">
        <div
          id="playground"
          className="w-full h-full flex flex-col overflow-auto border-r border-gray-300"
        >
          <div className="flex flex-col space-y-4 px-4 divide-y divide-gray-300">
            <div
              id="Messages"
              className="w-full flex flex-col py-4 space-y-4 overflow-auto"
            >
              <div className="flex flex-col space-y-2">
                <h2
                  className="text-md font-semibold tracking-tight"
                  style={{
                    fontFamily: "monospace",
                  }}
                >
                  Messages
                </h2>
              </div>
              <div className="flex w-full space-x-4 divide-x divide-gray-300">
                {threads.map((thread, index) => (
                  <div
                    key={thread.id}
                    className={clsx(
                      index !== 0 ? "pl-4" : "",
                      "flex flex-col space-y-4 w-full"
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <ModelPill model={thread.model} />
                      <button
                        onClick={() => {
                          // remove the thread
                          setThreads((prevThreads) => {
                            return prevThreads.filter(
                              (prevThread) => prevThread.id !== thread.id
                            );
                          });
                        }}
                        className="text-red-500 font-semibold"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    {thread.messages.map((message) => (
                      <MessageInput
                        key={message.id}
                        initialValues={message}
                        onMessageChange={(messageInput: MessageInputItem) => {
                          // if the message is shared, update the message in all threads
                          // if the message is not shared, update the message in this thread
                          setThreads((prevThreads) => {
                            return prevThreads.map((thread) => {
                              return {
                                ...thread,
                                messages: thread.messages.map(
                                  (threadMessage) => {
                                    if (threadMessage.id === messageInput.id) {
                                      return messageInput;
                                    }
                                    return threadMessage;
                                  }
                                ),
                              };
                            });
                          });
                        }}
                        deleteMessage={(messageInputId: string) => {
                          // delete the message at this id for ALL threads
                          setThreads((prevThreads) => {
                            return prevThreads.map((thread) => {
                              return {
                                ...thread,
                                messages: thread.messages.filter(
                                  (threadMessage) =>
                                    threadMessage.id !== messageInputId
                                ),
                              };
                            });
                          });
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  // add a new message to all threads
                  setThreads((prevThreads) => {
                    return prevThreads.map((thread) => {
                      return {
                        ...thread,
                        messages: [
                          ...thread.messages,
                          {
                            id: crypto.randomUUID(),
                            // if the last message is a user message, make the new message an assistant message. and vice versa
                            role:
                              thread.messages[thread.messages.length - 1]
                                .role === "user"
                                ? "assistant"
                                : "user",
                            content: "",
                            shared: true,
                          },
                        ],
                      };
                    });
                  });
                }}
                className="bg-black text-white flex items-center px-3 py-1.5 text-xs w-fit rounded-lg"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add New Message
              </button>
            </div>
          </div>
        </div>
        <div className="w-[384px] h-full sticky top-0 flex flex-col overflow-auto space-y-4 divide-y divide-gray-300 rounded-tr-lg">
          <div className="sticky top-0 z-50 bg-white pt-4 px-4">
            <h2 className="tracking-wide text-gray-500 font-semibold">Setup</h2>
          </div>
          <Disclosure>
            {({ open }) => (
              <div className="">
                <Disclosure.Button
                  className="font-semibold text-md pt-4 px-4 tracking-tight w-full flex items-center justify-between"
                  style={{
                    fontFamily: "monospace",
                  }}
                >
                  Configuration
                  <div className="w-full flex items-center justify-end gap-2">
                    <ChevronRightIcon
                      className={clsx(
                        open && "rotate-90",
                        "ml-4 h-4 w-4 text-gray-500 ease-in-out transition-transform duration-300"
                      )}
                    />
                  </div>
                </Disclosure.Button>
                <Disclosure.Panel className="mt-2 px-4">
                  <div className="py-2 text-sm flex items-center justify-between w-full">
                    <label htmlFor="temperature">Model(s)</label>
                    <div className="w-full max-w-[228px]">
                      <MultiSelect
                        value={threads.map((thread) => thread.model)}
                        onValueChange={(model: string[]) => {
                          // if the model exists in the threads, keep it as it. if it doesn't exist, add it
                          // if the model is removed, remove it from the threads
                          setThreads((prevThreads) => {
                            return model.map((model) => {
                              const thread = prevThreads.find(
                                (prevThread) => prevThread.model === model
                              );
                              if (thread) {
                                return thread;
                              }
                              return {
                                id: crypto.randomUUID(),
                                model,
                                messages: [],
                              };
                            });
                          });
                        }}
                      >
                        {MODEL_LIST.map((model, index) => (
                          <MultiSelectItem key={index} value={model.value}>
                            {model.label}
                          </MultiSelectItem>
                        ))}
                      </MultiSelect>
                    </div>
                  </div>
                  <div className="py-2 text-sm flex items-center justify-between w-full">
                    <label htmlFor="temperature">Temperature</label>
                    <div className="w-full max-w-[228px]">
                      <NumberInput
                        id="temperature"
                        defaultValue={0.7}
                        min={0}
                        max={2}
                        value={temperature}
                        onValueChange={(value: number) => {
                          setTemperature(value);
                        }}
                        step={0.01}
                      />
                    </div>
                  </div>
                  <div className="py-2 text-sm flex items-center justify-between w-full">
                    <label htmlFor="max-tokens">Max Tokens</label>
                    <div className="w-full max-w-[228px]">
                      <NumberInput
                        id="max-tokens"
                        step={1}
                        defaultValue={1024}
                      />
                    </div>
                  </div>
                  <div className="py-2 text-sm flex items-center justify-between w-full">
                    <label htmlFor="seed">Seed</label>
                    <div className="w-full max-w-[228px]">
                      <NumberInput
                        id="seed"
                        min={0}
                        max={100}
                        step={1}
                        defaultValue={1}
                      />
                    </div>
                  </div>
                </Disclosure.Panel>
              </div>
            )}
          </Disclosure>
          <Disclosure>
            {({ open }) => (
              <div className="">
                <Disclosure.Button
                  className="font-semibold text-md pt-4 px-4 tracking-tight w-full flex items-center justify-between"
                  style={{
                    fontFamily: "monospace",
                  }}
                >
                  Configuration
                  <div className="w-full flex items-center justify-end gap-2">
                    <ChevronRightIcon
                      className={clsx(
                        open && "rotate-90",
                        "ml-4 h-4 w-4 text-gray-500 ease-in-out transition-transform duration-300"
                      )}
                    />
                  </div>
                </Disclosure.Button>
                <Disclosure.Panel className="mt-2 px-4">
                  <div className="py-2 text-sm flex items-center justify-between w-full">
                    <label htmlFor="temperature">Temperature</label>
                    <div className="w-full max-w-[228px]">
                      <NumberInput
                        id="temperature"
                        defaultValue={0.7}
                        min={0}
                        max={2}
                        value={temperature}
                        onValueChange={(value: number) => {
                          setTemperature(value);
                        }}
                        step={0.01}
                      />
                    </div>
                  </div>
                  <div className="py-2 text-sm flex items-center justify-between w-full">
                    <label htmlFor="max-tokens">Max Tokens</label>
                    <div className="w-full max-w-[228px]">
                      <NumberInput
                        id="max-tokens"
                        step={1}
                        defaultValue={1024}
                      />
                    </div>
                  </div>
                  <div className="py-2 text-sm flex items-center justify-between w-full">
                    <label htmlFor="seed">Seed</label>
                    <div className="w-full max-w-[228px]">
                      <NumberInput
                        id="seed"
                        min={0}
                        max={100}
                        step={1}
                        defaultValue={1}
                      />
                    </div>
                  </div>
                </Disclosure.Panel>
              </div>
            )}
          </Disclosure>
        </div>
        {/* <div
          id="messages"
          className="w-full h-full flex flex-col justify-between"
        >
          <div className="w-full h-full p-4 space-y-4 flex flex-col">
            <div className="flex items-center space-x-2 sticky">
              <h3 className="tracking-wide text-gray-500 font-semibold">
                Models
              </h3>
              <button
                onClick={() => {
                  // add a new thread with a new model. the thread should have the same messages as the other threads
                  setThreads((prevThreads) => {
                    return [
                      ...prevThreads,
                      {
                        id: crypto.randomUUID(),
                        model: "gpt-3.5-turbo",
                        messages: prevThreads[0].messages,
                      },
                    ];
                  });
                }}
                className="bg-black text-white flex items-center px-3 py-1.5 text-xs w-fit rounded-lg"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Model
              </button>
            </div>

            <ul
              id="model-list"
              className="flex w-full justify-between divide-x divide-gray-300"
            >
              {threads.map((thread, index) => (
                <li key={thread.id} className={clsx("w-full flex flex-col")}>
                  <div
                    className={clsx(
                      index !== 0 ? "pl-2" : "",
                      "border-b border-gray-300 pb-2 pr-2 flex items-center space-x-2"
                    )}
                  >
                    <SearchSelect
                      value={thread.model}
                      onValueChange={(e) => {
                        setThreads((prevThreads) => {
                          return prevThreads.map((prevThread) => {
                            if (prevThread.id === thread.id) {
                              return {
                                ...prevThread,
                                model: e,
                              };
                            }
                            return prevThread;
                          });
                        });
                      }}
                      enableClear={false}
                    >
                      {MODEL_LIST.map((model, index) => (
                        <SearchSelectItem key={index} value={model.value}>
                          {model.label}
                        </SearchSelectItem>
                      ))}
                    </SearchSelect>

                    {threads.length > 1 && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            // remove the thread
                            setThreads((prevThreads) => {
                              return prevThreads.filter(
                                (prevThread) => prevThread.id !== thread.id
                              );
                            });
                          }}
                          className="text-red-500 font-semibold"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="max-h-[52.5vh] flex-1 overflow-auto">
                    {thread.messages
                      .filter((message) => !message.shared)
                      .map((message) => (
                        <>
                          <MessageInput
                            initialValues={message}
                            onMessageChange={(message) => {}}
                            deleteMessage={(messageInputId) => {}}
                            editable={false}
                          />
                        </>
                      ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default PlaygroundV2;
