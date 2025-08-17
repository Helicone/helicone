import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import {
  universalTools,
  promptsTools,
  playgroundTools,
  filtersTools,
} from "@/lib/agent/tools";

type Tool = NonNullable<OpenAIChatRequest["tools"]>[0];
type Message = NonNullable<OpenAIChatRequest["messages"]>[0];

type ToolCallResult = {
  success: boolean;
  message: string;
};

interface HeliconeAgentTool extends Tool {
  handler?: (args: any) => Promise<ToolCallResult> | ToolCallResult;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
}

interface HeliconeAgentContextType {
  tools: HeliconeAgentTool[];
  setToolHandler: (
    toolName: string,
    handler: (args: any) => Promise<ToolCallResult> | ToolCallResult,
  ) => void;
  executeTool: (toolName: string, args: any) => Promise<ToolCallResult>;

  // Session management
  sessions: ChatSession[];
  currentSession: ChatSession | undefined;
  currentSessionId: string | null;
  messages: Message[];
  createNewSession: () => void;
  updateCurrentSessionMessages: (messages: Message[]) => void;
  switchToSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
}

const HeliconeAgentContext = createContext<
  HeliconeAgentContextType | undefined
>(undefined);

const getToolsForRoute = (pathname: string): HeliconeAgentTool[] => {
  const tools: HeliconeAgentTool[] = [...universalTools];

  // PATH SPECIFIC TOOLS
  if (pathname === "/prompts") {
    tools.push(...promptsTools);
  } else if (pathname === "/playground") {
    tools.push(...playgroundTools);
  }

  if (pathname === "/requests") {
    tools.push(...filtersTools);
  }

  return tools;
};

// TODO: utils to get contexts

export const HeliconeAgentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [tools, setTools] = useState<HeliconeAgentTool[]>([]);
  const [toolHandlers, setToolHandlers] = useState<
    Map<string, (args: any) => Promise<any> | any>
  >(new Map());

  // Session management state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Get current session and messages
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  useEffect(() => {
    const routeTools = getToolsForRoute(router.pathname);
    setTools(routeTools);
  }, [router.pathname]);

  useEffect(() => {
    setToolHandler("navigate", async (args: { page: string }) => {
      router.push(args.page);
      return {
        success: true,
        message: "Successfully navigated to " + args.page,
      };
    });
  }, [router]);

  // Initialize with first session if none exist
  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    }
  }, []);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      name: `Chat ${sessions.length + 1}`,
      messages: [],
      createdAt: new Date(),
    };
    setSessions((prev) => [...prev, newSession]);
    setCurrentSessionId(newSession.id);
  };

  const updateCurrentSessionMessages = (newMessages: Message[]) => {
    if (!currentSessionId) return;
    setSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId
          ? { ...session, messages: newMessages }
          : session,
      ),
    );
  };

  const switchToSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const deleteSession = (sessionId: string) => {
    // TODO
  };

  const setToolHandler = (
    toolName: string,
    handler: (args: any) => Promise<any> | any,
  ) => {
    setToolHandlers((prev) => new Map(prev.set(toolName, handler)));
    setTools((prevTools) =>
      prevTools.map((tool) =>
        tool.function.name === toolName ? { ...tool, handler } : tool,
      ),
    );
  };

  const executeTool = async (toolName: string, args: any) => {
    const handler = toolHandlers.get(toolName);
    if (!handler) {
      throw new Error(`No handler found for tool: ${toolName}`);
    }
    return await handler(args);
  };

  return (
    <HeliconeAgentContext.Provider
      value={{
        tools,
        setToolHandler,
        executeTool,
        sessions,
        currentSession,
        currentSessionId,
        messages,
        createNewSession,
        updateCurrentSessionMessages,
        switchToSession,
        deleteSession,
      }}
    >
      {children}
    </HeliconeAgentContext.Provider>
  );
};

export const useHeliconeAgent = () => {
  const context = useContext(HeliconeAgentContext);
  if (context === undefined) {
    throw new Error(
      "useHeliconeAgent must be used within a HeliconeAgentProvider",
    );
  }
  return context;
};
