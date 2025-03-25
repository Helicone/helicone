import ThemedModal from "@/components/shared/themed/themedModal";
import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { useLocalStorage } from "@/services/hooks/localStorage";
import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { PROMPT_MODES } from "../../components/chatComponent/chatTopBar";
import { JsonRenderer } from "../chatComponent/single/JsonRenderer";

interface ErrorMessageProps {
  mapperContent: MappedLLMRequest;
  className?: string;
}
export const ErrorMessage = ({
  mapperContent,
  className,
}: ErrorMessageProps) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useLocalStorage<(typeof PROMPT_MODES)[number]>(
    "error-mode",
    "Pretty"
  );
  const [allExpanded, setAllExpanded] = useState(false);

  const toggleAllExpanded = () => {
    setAllExpanded(!allExpanded);
  };

  const errorData = useMemo(() => {
    const response:
      | string
      | { helicone_error: string; parse_response_error?: string } =
      mapperContent?.raw.response ?? "";
    try {
      // Check if the error is a string that contains JSON
      if (typeof response === "string") {
        try {
          const parsed = JSON.parse(response);
          if (parsed.helicone_error && parsed.parse_response_error) {
            // Extract the actual error message without the newlines
            const cleanErrorMessage = parsed.parse_response_error
              .split("\n")
              .filter((line: string) => line.trim() !== "")
              .join(" ");

            return {
              type: "parse_error",
              title: "Error Parsing Response",
              details:
                cleanErrorMessage ||
                "Unable to parse the response from the API",
              raw: parsed,
            };
          }
        } catch (e) {
          // Not JSON, continue with normal flow
        }
      }

      // Handle object error message
      if (typeof response === "object" && response !== null) {
        if (response.helicone_error && response?.parse_response_error) {
          // Extract the actual error message without the newlines
          const cleanErrorMessage = response.parse_response_error
            .split("\n")
            .filter((line: string) => line.trim() !== "")
            .join(" ");

          return {
            type: "parse_error",
            title: "Error Parsing Response",
            details:
              cleanErrorMessage || "Unable to parse the response from the API",
            raw: response,
          };
        }
      }

      // Default error handling
      if (typeof response === "string") {
        return {
          type: "standard",
          message: response,
          raw: response,
        };
      }

      if (response?.helicone_error) {
        return {
          type: "standard",
          message: JSON.stringify(response?.helicone_error, null, 2),
          raw: response?.helicone_error,
        };
      }

      return {
        type: "unknown",
        message: JSON.stringify(response, null, 2),
        raw: response,
      };
    } catch (e) {
      return {
        type: "error_parsing",
        message: "Error parsing error message",
        raw: mapperContent.raw.response,
      };
    }
  }, [mapperContent]);

  const renderErrorContent = (isModal = false) => {
    return (
      <div
        className={`w-full border border-slate-200 dark:border-gray-700 divide-y divide-gray-300 dark:divide-gray-700 h-full ${className}`}
      >
        <div className="w-full flex flex-col text-left space-y-8 text-sm p-4">
          <div className="w-full flex flex-col text-left space-y-1 text-sm">
            <p className="font-semibold text-sm">
              Response <span className="text-red-500 text-xs">(Error)</span>
            </p>
            {mode === "Debug" ? (
              <pre className="p-2 border rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
                {JSON.stringify(mapperContent, null, 2)}
              </pre>
            ) : mode === "JSON" ? (
              <pre className="p-2 border rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
                {JSON.stringify(mapperContent.raw.response, null, 2)}
              </pre>
            ) : errorData.type === "parse_error" ? (
              <div className="p-4 border rounded-md bg-destructive/10 dark:bg-destructive/20">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="ml-3 w-full">
                    <h3 className="text-sm font-medium text-destructive dark:text-destructive">
                      {errorData.title}
                    </h3>
                    <div className="mt-2 text-sm text-destructive/80 dark:text-destructive/90">
                      <p className="mb-2">
                        The API returned an invalid response that couldn&apos;t
                        be processed.
                      </p>
                      <div className="overflow-auto max-h-60 rounded-md bg-destructive/5 dark:bg-destructive/10 p-2 font-mono text-xs">
                        {errorData.details}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <pre className="p-2 border rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
                {errorData.message}
              </pre>
            )}
          </div>
          <p className="font-semibold text-sm">Request</p>
          <pre className="p-2 border rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
            <JsonRenderer data={mapperContent.raw.request} />
          </pre>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderErrorContent()}
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="w-[80vw] rounded-md divide-y divide-gray-300 dark:divide-gray-700 h-full">
          {renderErrorContent(true)}
        </div>
      </ThemedModal>
    </>
  );
};
