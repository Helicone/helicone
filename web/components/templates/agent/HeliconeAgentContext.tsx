import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";

type Tool = NonNullable<OpenAIChatRequest["tools"]>[0];
type ToolCallResult = {
  success: boolean,
  message: string,
}

interface HeliconeAgentTool extends Tool {
  handler?: (args: any) => Promise<ToolCallResult> | ToolCallResult;
}

interface HeliconeAgentContextType {
  tools: HeliconeAgentTool[];
  setToolHandler: (toolName: string, handler: (args: any) => Promise<ToolCallResult> | ToolCallResult) => void;
  executeTool: (toolName: string, args: any) => Promise<ToolCallResult>;
}

const HeliconeAgentContext = createContext<HeliconeAgentContextType | undefined>(undefined);

const getToolsForRoute = (pathname: string): HeliconeAgentTool[] => {
  const tools: HeliconeAgentTool[] = [];

  if (pathname === "/prompts") {
    tools.push({
      type: "function",
      function: {
        name: "search-prompts",
        description: "Search for prompts by name or content",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query to filter prompts",
            },
          },
          required: ["query"],
        },
      }
    });
  }

  return tools;
};

export const HeliconeAgentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [tools, setTools] = useState<HeliconeAgentTool[]>([]);
  const [toolHandlers, setToolHandlers] = useState<Map<string, (args: any) => Promise<any> | any>>(new Map());

  useEffect(() => {
    const routeTools = getToolsForRoute(router.pathname);
    setTools(routeTools);
  }, [router.pathname]);

  const setToolHandler = (toolName: string, handler: (args: any) => Promise<any> | any) => {
    setToolHandlers(prev => new Map(prev.set(toolName, handler)));
    setTools(prevTools => 
      prevTools.map(tool => 
        tool.function.name === toolName ? { ...tool, handler } : tool
      )
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
    <HeliconeAgentContext.Provider value={{ tools, setToolHandler, executeTool }}>
      {children}
    </HeliconeAgentContext.Provider>
  );
};

export const useHeliconeAgent = () => {
  const context = useContext(HeliconeAgentContext);
  if (context === undefined) {
    throw new Error("useHeliconeAgent must be used within a HeliconeAgentProvider");
  }
  return context;
}; 