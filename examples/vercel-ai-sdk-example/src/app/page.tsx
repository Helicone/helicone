"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debug, setDebug] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Clear debug messages
    setDebug([]);

    // Add user message to the chat
    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Create an assistant message placeholder with empty content
    const assistantMessageId = uuidv4();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      },
    ]);

    try {
      console.log("Sending request to /api/chat");
      // Send the messages to the API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      console.log("Response received:", response.status, response.statusText);
      setDebug((prev) => [
        ...prev,
        `Response status: ${response.status} ${response.statusText}`,
      ]);

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        setDebug((prev) => [...prev, `Error response: ${errorText}`]);
        throw new Error(
          `Network response was not ok: ${response.status} ${response.statusText}`,
        );
      }

      // Process the SSE stream from the Vercel AI SDK
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let chunkCount = 0;

      console.log("Starting to read stream");
      setDebug((prev) => [...prev, "Starting to read stream"]);

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          console.log("Stream read complete");
          setDebug((prev) => [...prev, "Stream read complete"]);
          break;
        }

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        chunkCount++;
        console.log(`Received chunk #${chunkCount}:`, chunk);
        setDebug((prev) => [
          ...prev,
          `Chunk #${chunkCount} received (${chunk.length} chars)`,
        ]);

        // Parse the Vercel AI SDK format
        const lines = chunk.split("\n");
        console.log(`Found ${lines.length} lines in chunk`);
        setDebug((prev) => [...prev, `Found ${lines.length} lines in chunk`]);

        for (const line of lines) {
          // Log line for debugging
          if (line.trim()) {
            console.log("Line:", line);
            setDebug((prev) => [
              ...prev,
              `Line: ${line.substring(0, 50)}${line.length > 50 ? "..." : ""}`,
            ]);
          }

          // Handle text chunks (Vercel AI SDK format with "0:" prefix)
          if (line.startsWith("0:")) {
            try {
              // Extract content from the format 0:"content"
              const contentMatch = line.match(/0:"(.*)"/);
              if (contentMatch && contentMatch[1]) {
                const textChunk = contentMatch[1];
                console.log("Found text chunk:", textChunk);
                setDebug((prev) => [...prev, `Text chunk: ${textChunk}`]);

                // Add to accumulated content
                accumulatedContent += textChunk;

                // Update the message in the UI
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg,
                  ),
                );
              } else {
                // Try another pattern: 0:"part1" 0:"part2"
                const parts = line.split(" ");
                for (const part of parts) {
                  if (part.startsWith("0:")) {
                    const textMatch = part.match(/0:"(.*)"/);
                    if (textMatch && textMatch[1]) {
                      const textChunk = textMatch[1];
                      console.log("Found text chunk in part:", textChunk);
                      setDebug((prev) => [
                        ...prev,
                        `Text chunk part: ${textChunk}`,
                      ]);

                      // Add to accumulated content
                      accumulatedContent += textChunk;

                      // Update the message in the UI
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessageId
                            ? { ...msg, content: accumulatedContent }
                            : msg,
                        ),
                      );
                    }
                  }
                }
              }
            } catch (e) {
              console.error("Error parsing text chunk:", e);
              setDebug((prev) => [
                ...prev,
                `Error parsing text chunk: ${
                  e instanceof Error ? e.message : String(e)
                }`,
              ]);
            }
          }

          // Also try the standard SSE format as a fallback
          else if (line.startsWith("data: ")) {
            const data = line.slice(6);
            console.log("SSE data:", data);
            setDebug((prev) => [
              ...prev,
              `SSE data: ${data.substring(0, 50)}${
                data.length > 50 ? "..." : ""
              }`,
            ]);

            // Handle the [DONE] signal
            if (data === "[DONE]") {
              console.log("Received [DONE] signal");
              setDebug((prev) => [...prev, "Received [DONE] signal"]);
              continue;
            }

            try {
              const parsedData = JSON.parse(data);
              console.log(
                "Parsed data structure:",
                JSON.stringify(parsedData, null, 2),
              );
              setDebug((prev) => [
                ...prev,
                `Parsed data keys: ${Object.keys(parsedData).join(", ")}`,
              ]);

              // Handle different formats
              if (parsedData.text) {
                console.log("Found 'text' property:", parsedData.text);
                accumulatedContent += parsedData.text;
              } else if (parsedData.content) {
                console.log("Found 'content' property:", parsedData.content);
                accumulatedContent += parsedData.content;
              }

              // Update the message in the UI
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedContent }
                    : msg,
                ),
              );
            } catch (e) {
              console.error("Error parsing data:", e);
              setDebug((prev) => [
                ...prev,
                `Parse error: ${e instanceof Error ? e.message : String(e)}`,
              ]);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setDebug((prev) => [
        ...prev,
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ]);

      // Update the error in the UI
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: "Error: Failed to get a response. Please try again.",
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-zinc-100">
      <header className="p-6 border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white">
            Amazon Bedrock AI Chatbot
          </h1>
          <p className="text-zinc-400 text-sm">
            Powered by Vercel AI SDK & Claude
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 p-2 space-y-4 rounded-lg">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 rounded-lg bg-zinc-800/30 backdrop-blur-sm max-w-md">
                  <div className="mb-4 text-3xl">👋</div>
                  <h2 className="text-xl font-semibold mb-2 text-zinc-200">
                    Welcome!
                  </h2>
                  <p className="text-zinc-400">
                    Send a message to start chatting with Claude via Amazon
                    Bedrock.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`p-4 rounded-2xl max-w-[80%] ${
                        message.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-zinc-800 border border-zinc-700 text-zinc-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          {/* Debug panel
          {debug.length > 0 && (
            <div className="mb-4 p-3 bg-red-900/30 rounded-lg border border-red-800 text-xs overflow-auto max-h-[200px]">
              <div className="font-bold mb-1">Debug:</div>
              {debug.map((msg, i) => (
                <div key={i} className="text-red-300">
                  {msg}
                </div>
              ))}
            </div>
          )} */}
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Claude a question..."
              className="w-full p-4 pr-20 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="absolute right-2 top-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors text-white disabled:opacity-50 disabled:pointer-events-none"
              disabled={isLoading || !input.trim()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
