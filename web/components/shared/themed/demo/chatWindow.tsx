import { Textarea } from "@tremor/react";
import { useJawnClient } from "../../../../lib/clients/jawnHook";
import { Col, Row } from "../../../layout/common";
import { clsx } from "../../clsx";
import { ChatHistory } from "./ChatHistory";
import Typewriter from "./typewriter";
import { useState, useEffect, useRef } from "react";
import { hpf } from "@helicone/prompts";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";

export const ChatWindow = ({
  chatHistory,
  setChatHistory,
  onFinish,
  movieTitle,
  movieCharacter,
  gameSessionId,
}: {
  chatHistory: ChatHistory[];
  setChatHistory: (chatHistory: ChatHistory[]) => void;
  onFinish: () => void;
  movieTitle: string;
  movieCharacter: string;
  isLoading: boolean;
  gameSessionId: string | null;
}) => {
  const jawn = useJawnClient();

  const [sendingMessage, setSendingMessage] = useState(false);
  const [message, setMessage] = useState("");
  const { user } = useHeliconeAuthClient();

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, sendingMessage]);

  async function sendMessage(message: string) {
    if (sendingMessage) return;
    setSendingMessage(true);
    const chatHistoryCopy: ChatHistory[] = JSON.parse(
      JSON.stringify(chatHistory),
    );
    setMessage("");

    const correctGuessCheckerPromise = jawn.POST("/v1/demo/completion", {
      body: {
        promptId: "Movie-Character-Guesser-Chat-Checker",
        userEmail: user?.email ?? "no-email",
        sessionId: gameSessionId ?? "",
        sessionName: "Movie Character Guesser",
        messages: [
          {
            role: "system",
            content: `
You are a helpful assistant that checks if the user correctly guessed a character. You can accept answers that are pretty close or spelt slightly differently.

ONLY return true if the user correctly guessed the character. Return false if not.


Example:
Assistant: "Character: Rachael Ray"
User Message: : "I think it's John Travolta"
Response: "false"

Assistant: "Character: Rachael Ray"
User Message: : "Are you Rachael?"
Response: "true"
            `,
          },
          {
            role: "user",
            content: hpf`Character: ${{ movieCharacter }}`,
          },
          {
            role: "user",
            content: hpf`User Message: ${{ message }}`,
          },
        ],
      },
    });

    const responsePromise = jawn.POST("/v1/demo/completion", {
      body: {
        promptId: "Movie-Character-Guesser-Chat",
        userEmail: user?.email ?? "no-email",
        sessionId: gameSessionId ?? "",
        sessionName: "Movie Character Guesser",
        messages: [
          {
            role: "system",
            content: hpf`You are ${{ movieCharacter }} from the movie ${{
              movieTitle,
            }}. Answer the questions as if you are ${{ movieCharacter }}.

DO NOT GIVE AWAY YOUR IDENTITY. THE USER IS TRYING TO GUESS THE CHARACTER.
            `,
          },
          ...chatHistory,
          {
            role: "user",
            content: message,
          },
        ],
      },
    });
    setChatHistory([...chatHistoryCopy, { role: "user", content: message }]);

    const correctGuessChecker = await correctGuessCheckerPromise;

    if (correctGuessChecker.data?.data?.choices[0].message.content === "true") {
      onFinish();
    } else {
      const response = await responsePromise;

      const responseContent = response.data?.data?.choices[0].message.content;
      setChatHistory([
        ...chatHistoryCopy,
        { role: "user", content: message },
        { role: "assistant", content: responseContent || "" },
      ]);
    }
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setSendingMessage(false);
  }

  return (
    <Col className="flex h-full w-full flex-col">
      <Col className="flex-shrink-0 p-4">
        <p className="animate-popin text-center text-2xl tracking-[10px]">
          Your movie is
        </p>
        <div className="flex justify-center tracking-[5px]">
          <Typewriter
            text={movieTitle}
            speed={50}
            delay={1000}
            onComplete={() => {}}
          />
        </div>
      </Col>
      <Col className="flex-grow overflow-hidden rounded-xl bg-white bg-opacity-20">
        <Col className="flex h-full flex-col">
          <Col className="flex-grow space-y-4 overflow-y-auto p-4 text-white">
            {chatHistory.map((chat, index) => (
              <Row
                key={index}
                className={clsx(
                  "w-full",
                  chat.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <Col
                  className={clsx(
                    "max-w-[80%] rounded-lg p-2 px-3 shadow-sm",
                    chat.role === "user" ? "bg-blue-500" : "bg-blue-400",
                  )}
                >
                  {chat.role === "user" ? (
                    <div>{chat.content}</div>
                  ) : (
                    <Typewriter
                      text={chat.content}
                      speed={5}
                      delay={0}
                      onComplete={() =>
                        chatEndRef.current?.scrollIntoView({
                          behavior: "smooth",
                        })
                      }
                    />
                  )}
                </Col>
              </Row>
            ))}
            {sendingMessage && (
              <Row className={clsx("w-full", "animate-pulse justify-start")}>
                <Col
                  className={clsx(
                    "max-w-[80%] rounded-lg p-2 px-3 shadow-sm",
                    "bg-blue-400",
                  )}
                >
                  ...
                </Col>
              </Row>
            )}
            <div ref={chatEndRef} />
          </Col>
          <Col className="flex-shrink-0 bg-white bg-opacity-10 p-4">
            <Row className={clsx("w-full", sendingMessage && "opacity-50")}>
              <Textarea
                disabled={sendingMessage}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(message);
                  }
                }}
                className="flex-grow"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                onClick={() => sendMessage(message)}
                className="ml-2 flex items-center justify-center p-2 text-2xl"
              >
                🚀
              </button>
            </Row>
            <div className="mt-2 text-center text-sm italic text-opacity-45">
              Ask questions to try to guess the character from the movie.
            </div>
          </Col>
        </Col>
      </Col>
    </Col>
  );
};
