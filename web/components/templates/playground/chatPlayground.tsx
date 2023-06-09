import {
  PaperAirplaneIcon,
  PencilIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";
import { Message } from "../requests/requestsPage";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import useNotification from "../../shared/notification/useNotification";
import {
  ChatCompletionRequestMessage,
  CreateChatCompletionResponse,
} from "openai";
import ChatRow from "./chatRow";
import { fetchOpenAI } from "../../../services/lib/openAI";

interface ChatPlaygroundProps {
  requestId: string;
  chat: Message[];
  model: string;
  temperature: number;
}

const ChatPlayground = (props: ChatPlaygroundProps) => {
  const { requestId, chat, model, temperature } = props;

  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setNotification } = useNotification();

  const [currentChat, setCurrentChat] = useState<Message[]>(chat);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (text: string, history: Message[]) => {
    if (text.trim() === "") {
      setNotification("Please enter in a message", "info");
      return;
    }

    const newChat = [...history];
    newChat.push({
      content: text,
      role: "user",
    });
    setCurrentChat(newChat);
    setIsLoading(true);
    setText("");

    const resp = await fetchOpenAI(
      newChat as ChatCompletionRequestMessage[],
      requestId,
      temperature,
      model
    );
    if (resp) {
      newChat.push({
        content:
          resp.choices[0].message?.content ||
          "Failed to fetch response. Please try again",
        role: resp.choices[0].message?.role || "system",
      });
      setCurrentChat(newChat);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  return (
    <ul className="w-full border border-gray-300 rounded-lg pb-[5.75rem]">
      {currentChat.map((c, i) => {
        const slice = currentChat.slice(0, i + 1);

        return (
          <ChatRow
            key={i}
            index={i}
            messages={slice}
            callback={(userText: string, history: Message[] | null) => {
              if (history) {
                handleSubmit(userText, history);
              } else {
                // change the system message
                const newChat = [...currentChat];
                newChat[i].content = userText;
                setCurrentChat(newChat);
              }
            }}
          />
        );
      })}
      {isLoading && (
        <li className="flex flex-row justify-between px-4 py-6">
          <p>thinking...</p>
        </li>
      )}
      <li className="w-full flex absolute bottom-0 mb-4 items-center">
        <div className="flex bg-white rounded-xl shadow-xl items-center mx-auto w-[90%] p-1.5">
          <textarea
            ref={textareaRef}
            rows={1}
            className="flex-1 max-h-96 resize-none whitespace-pre-wrap rounded-l-lg overflow-auto leading-7 border-none text-gray-900 focus:outline-none focus:ring-0"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(text, currentChat);
              }
            }}
          />
          <button
            className="p-2 self-end"
            onClick={() => handleSubmit(text, currentChat)}
          >
            <PaperAirplaneIcon className="h-8 w-8 inline bg-green-500 text-white p-1 rounded-lg" />
          </button>
        </div>
      </li>
    </ul>
  );
};

export default ChatPlayground;
