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
    <div className="w-full flex flex-col text-left space-y-1 text-xs">
      <p className="text-gray-500 font-medium">Messages</p>
      <div className="text-xs w-full border border-gray-300 rounded-md overflow-auto divide-y divide-gray-200 h-full max-h-[500px]">
        {messages.map((message, index) => {
          const isAssistant = message.role === "assistant";
          const isSystem = message.role === "system";
          const isUser = message.role === "user";

          return (
            <div key={index} className="">
              <div
                className={clsx(
                  isAssistant || isSystem ? "bg-gray-100" : "bg-white",
                  "items-start px-4 py-4 text-left font-semibold grid grid-cols-10 gap-2"
                )}
              >
                <div className="col-span-1">
                  {isAssistant || isSystem ? (
                    <Image
                      src={"/assets/chatGPT.png"}
                      className="h-5 w-5 rounded-md"
                      height={24}
                      width={24}
                      alt="ChatGPT Logo"
                    />
                  ) : (
                    <UserCircleIcon className="h-5 w-5 bg-white rounded-full" />
                  )}
                </div>
                <div className="whitespace-pre-wrap col-span-9">
                  {message.content}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
