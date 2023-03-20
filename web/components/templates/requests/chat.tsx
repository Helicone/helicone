import { UserCircleIcon, UserIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { clsx } from "../../shared/clsx";
import { ChatProperties, CsvData } from "./requestsPage";

interface ChatProps {
  chatProperties: ChatProperties;
}

export const Chat = (props: ChatProps) => {
  const { request, response } = props.chatProperties;
  let messages = request ? request : [];

  if (response) {
    messages = messages.concat([response]);
  }

  return (
    <div className="w-full flex flex-col text-left space-y-2 text-sm">
      <p className="text-gray-500 font-medium">Messages</p>
      <div className="w-full border border-gray-300 rounded-md overflow-auto divide-y divide-gray-200 h-full">
        {messages.length > 0 ? (
          messages.map((message, index) => {
            const isAssistant = message.role === "assistant";
            const isSystem = message.role === "system";

            return (
              <div key={index} className="">
                <div
                  className={clsx(
                    isAssistant || isSystem ? "bg-gray-100" : "bg-white",
                    "items-start px-4 py-4 text-left grid grid-cols-12",
                    isSystem ? "font-semibold" : ""
                  )}
                >
                  <div className="col-span-1">
                    {isAssistant || isSystem ? (
                      <Image
                        src={"/assets/chatGPT.png"}
                        className="h-7 w-7 rounded-md"
                        height={30}
                        width={30}
                        alt="ChatGPT Logo"
                      />
                    ) : (
                      <UserCircleIcon className="h-7 w-7 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="whitespace-pre-wrap col-span-11 leading-6">
                    {message.content}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="">
            <div
              className={clsx(
                "bg-gray-100 items-start px-4 py-4 text-left font-semibold grid grid-cols-10 gap-2"
              )}
            >
              n/a
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
