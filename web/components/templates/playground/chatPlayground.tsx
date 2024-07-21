import {
  ChatCompletionCreateParams,
  ChatCompletionTool,
} from "openai/resources/chat";
import React, { useState } from "react";
import { fetchAnthropic } from "../../../services/lib/providers/anthropic";
import { fetchOpenAI } from "../../../services/lib/providers/openAI";
import { Col } from "../../layout/common";
import useNotification from "../../shared/notification/useNotification";
import { Message } from "../requests/chatComponent/types";
import ChatInputArea from "./ChatInputArea";
import ChatMessages from "./ChatMessages";
import ChatPlaygroundFooter from "./ChatPlaygroundFooter";
import { PlaygroundModel } from "./playgroundPage";

interface ChatPlaygroundProps {
  requestId: string;
  chat: Message[];
  models: PlaygroundModel[];
  temperature: number;
  maxTokens: number;
  tools?: ChatCompletionTool[];
  providerAPIKey?: string;
  onSubmit?: (history: Message[]) => void;
  submitText?: string;
  customNavBar?: {
    onBack: () => void;
    onContinue: () => void;
  };
}

const ChatPlayground: React.FC<ChatPlaygroundProps> = (props) => {
  const {
    chat,
    models,
    temperature,
    maxTokens,
    tools,
    onSubmit,
    submitText = "Submit",
    customNavBar,
    providerAPIKey,
  } = props;

  const { setNotification } = useNotification();
  const [currentChat, setCurrentChat] = useState<Message[]>(chat);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (history: Message[]) => {
    if (models.length < 1) {
      setNotification("Please select a model", "error");
      return;
    }

    if (!providerAPIKey) {
      setNotification("Please enter your API key to access provider.", "error");
      return;
    }
    setIsLoading(true);

    const responses = await Promise.all(
      models.map(async (model) => {
        // Filter and map the history as before
        const cleanMessages = (history: Message[]) => {
          return history
            .filter(
              (message) =>
                message.model === model.name ||
                message.model === undefined ||
                message.tool_calls
            )
            .map((message) => ({
              content: message.content ?? "",
              role: message.role,
            }));
        };

        const historyWithoutId = cleanMessages(history);

        // Record the start time
        const startTime = new Date().getTime();

        if (model.provider === "OPENAI") {
          // Perform the OpenAI request
          const { data, error } = await fetchOpenAI({
            messages:
              historyWithoutId as unknown as ChatCompletionCreateParams[],
            temperature,
            model: model.name,
            maxTokens,
            tools,
            openAIApiKey: providerAPIKey,
          });

          // Record the end time and calculate latency
          const endTime = new Date().getTime();
          const latency = endTime - startTime; // Latency in milliseconds

          // Return the model, data, error, and latency
          return { model, data, error, latency };
        } else {
          // Perform the Anthropic request
          const { data, error } = await fetchAnthropic(
            historyWithoutId as unknown as ChatCompletionCreateParams[],
            temperature,
            model.name,
            maxTokens,
            providerAPIKey
          );

          // Record the end time and calculate latency
          const endTime = new Date().getTime();
          const latency = endTime - startTime; // Latency in milliseconds

          // Return the model, data, error, and latency
          return { model, data, error, latency };
        }
      })
    );

    responses.forEach(({ model, data, error, latency }) => {
      if (error !== null) {
        setNotification(`${model}: ${error}`, "error");
        return;
      }

      const getContent = (data: any) => {
        // Check for tool calls and extract them if present
        if (
          data.choices &&
          data.choices.length > 0 &&
          data.choices[0].message?.tool_calls
        ) {
          const message = data.choices[0].message;
          const tools = message.tool_calls;
          const functionTools = tools.filter(
            (tool: any) => tool.type === "function"
          );
          return JSON.stringify(functionTools, null, 4);
        }
        // Check for content in choices array
        else if (
          data.choices &&
          data.choices.length > 0 &&
          data.choices[0].message?.content
        ) {
          return data.choices[0].message.content;
        }
        // Check for content in the main content array
        else if (
          data.content &&
          data.content.length > 0 &&
          data.content[0].text
        ) {
          return data.content[0].text;
        }
        // Default case if no content is found
        else {
          return `${
            data.model || "Model"
          } failed to fetch response. Please try again`;
        }
      };
      const getRole = (data: any) => {
        if (data.choices && data.choices[0].message?.role) {
          return data.choices[0].message.role;
        } else if (data.role) {
          return data.role;
        } else {
          return "assistant";
        }
      };

      if (data) {
        history.push({
          id: crypto.randomUUID(),
          content: getContent(data),
          role: getRole(data),
          model: model.name, // Include the model in the message
          latency, // client side calculated latency
        });
      }
    });
    setCurrentChat(history);

    setIsLoading(false);
  };

  const deleteRowHandler = (rowId: string) => {
    setCurrentChat((prevChat) =>
      prevChat.filter((message) => message.id !== rowId)
    );
  };

  return (
    <Col>
      {/* <ChatPlaygroundHeader /> */}
      <ChatMessages
        currentChat={currentChat}
        setCurrentChat={setCurrentChat}
        deleteRowHandler={deleteRowHandler}
        isLoading={isLoading}
      />
      <ChatInputArea
        currentChat={currentChat}
        setCurrentChat={setCurrentChat}
        onSubmit={onSubmit || handleSubmit}
        submitText={submitText}
        customNavBar={customNavBar}
      />
      {customNavBar && (
        <ChatPlaygroundFooter
          onBack={customNavBar.onBack}
          onContinue={() => {
            if (onSubmit) {
              onSubmit(currentChat);
            }
            customNavBar.onContinue();
          }}
        />
      )}
    </Col>
  );
};

export default ChatPlayground;
