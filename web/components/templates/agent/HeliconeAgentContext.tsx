import {
  filtersTools,
  playgroundTools,
  promptsTools,
  universalTools,
  hqlTools,
} from "@/lib/agent/tools";
import { $JAWN_API } from "@/lib/clients/jawn";
import { OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import { useRouter } from "next/router";
import React, { createContext, useContext, useEffect, useState } from "react";

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
  escalated: boolean;
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
  updateCurrentSessionMessages: (
    messages: Message[],
    saveToDB: boolean,
  ) => void;
  switchToSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  escalateSession: () => void;
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

  if (pathname === "/hql") {
    tools.push(...hqlTools);
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
  const { data: threads, refetch: refetchThreads } = $JAWN_API.useQuery(
    "get",
    "/v1/agent/threads",
    {},
  );
  const { mutate: upsertThreadMessage } = $JAWN_API.useMutation(
    "post",
    "/v1/agent/thread/{sessionId}/message",
    {
      onSuccess: () => {
        refetchThreads();
      },
    },
  );

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentSessionId) {
      const sessionId = crypto.randomUUID();
      setCurrentSessionId(sessionId);
    }
  }, []);

  const [escalated, setEscalated] = useState<boolean>(false);
  const { data: thread, refetch: refetchThread } = $JAWN_API.useQuery("get", "/v1/agent/thread/{sessionId}", {
    params: {
      path: {
        sessionId: currentSessionId || "",
      },
    },
  }, {
    enabled: !!currentSessionId,
    refetchInterval: escalated ? 2_500 : undefined,
 
  });
  

  useEffect(() => {
    if (thread?.data?.escalated) {
      setEscalated(true);
    } else {
      setEscalated(false);
    }
  }, [thread]);

  const { mutate: deleteThread } = $JAWN_API.useMutation("delete", "/v1/agent/thread/{sessionId}", {
    onSuccess: () => {
      refetchThreads();
    }
  });
  const { mutate: escalateThread } = $JAWN_API.useMutation("post", "/v1/agent/thread/{sessionId}/escalate", {
    onSuccess: () => {
      refetchThreads();
      refetchThread();
    }
  });

  const { mutate: deleteThread } = $JAWN_API.useMutation(
    "delete",
    "/v1/agent/thread/{sessionId}",
    {
      onSuccess: () => {
        refetchThreads();
      },
    },
  );

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
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello, how can I help you today?",
    },
  ]);
  useEffect(() => {
    if ((thread?.data?.chat as any)?.messages) {
      setMessages((thread?.data?.chat as any)?.messages);
    }
  }, [thread]);

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
        sessions:
          threads?.data?.map((thread) => ({
            id: thread.id,
            name: thread.last_message ?? thread.id,
            messages: [],
            createdAt: new Date(thread.created_at),
            escalated: thread.escalated,
          })) ?? [],
        currentSession: undefined,
        currentSessionId: null,
        messages: messages,
        escalateSession: () => {
          escalateThread({
            params: {
              path: {
                sessionId: currentSessionId || "",
              },
            },
          });
        },
        createNewSession: () => {
          const newSessionId = crypto.randomUUID();
          const newChatMessages = [
            {
              role: "assistant",
              content: "Hello, how can I help you today?",
            },
          ];
          upsertThreadMessage({
            params: {
              path: {
                sessionId: newSessionId,
              },
            },
            body: {
              messages: newChatMessages as any,
              metadata: {
                posthogSession: "test",
              },
            },
          });
          setMessages(newChatMessages);
          setCurrentSessionId(newSessionId);
        },
        updateCurrentSessionMessages: (messages, saveToDB) => {
          if (saveToDB && currentSessionId) {
            upsertThreadMessage({
              params: {
                path: {
                  sessionId: currentSessionId || "",
                },
              },
              body: {
                messages: messages as any,
                metadata: {
                  posthogSession: "test",
                },
              },
            });
          }
          setMessages(messages);
        },
        switchToSession: (sessionId: string) => {
          setCurrentSessionId(sessionId);
        },
        deleteSession: (sessionId: string) => {
          deleteThread({
            params: {
              path: {
                sessionId: sessionId,
              },
            },
          });
        },
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
