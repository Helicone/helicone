import React from "react";
import { Copy } from "lucide-react";
import useNotification from "@/components/shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface JsonViewProps {
  requestBody: any;
  responseBody: any;
}

export const JsonView: React.FC<JsonViewProps> = ({
  requestBody,
  responseBody,
}) => {
  const { setNotification } = useNotification();

  const handleCopy = (content: any, type: string) => {
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    setNotification(`${type} copied to clipboard`, "success");
  };

  return (
    <div className="flex flex-col space-y-8 bg-card relative text-muted-foreground">
      {requestBody && Object.keys(requestBody).length > 0 && (
        <div className="flex flex-col space-y-2 p-4">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-sidebar-foreground text-xs">
              Request
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(requestBody, "Request")}
                    className="h-6 w-6"
                  >
                    <Copy size={14} />
                    <span className="sr-only">Copy request</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy request</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <pre className="bg-sidebar-background text-xs whitespace-pre-wrap rounded-md overflow-auto p-4 border border-border">
            {JSON.stringify(requestBody, null, 2)}
          </pre>
        </div>
      )}
      {responseBody && Object.keys(responseBody).length > 0 && (
        <div className="flex flex-col space-y-2 p-4">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-sidebar-foreground text-xs">
              Response
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(responseBody, "Response")}
                    className="h-6 w-6"
                  >
                    <Copy size={14} />
                    <span className="sr-only">Copy response</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy response</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <pre className="bg-sidebar-background text-xs whitespace-pre-wrap rounded-md overflow-auto p-4 border border-border">
            {JSON.stringify(responseBody, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
