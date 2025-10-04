import ThemedModal from "@/components/shared/themed/themedModal";
import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";
import { useLocalStorage } from "@/services/hooks/localStorage";
import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { PROMPT_MODES } from "../../components/chatComponent/chatTopBar";
import { JsonRenderer } from "../chatComponent/single/JsonRenderer";
import DOMPurify from "dompurify";

function SafeHtmlRenderer({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }); // removes all tags by default
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

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
    "Pretty",
  );
  const [allExpanded, setAllExpanded] = useState(false);

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

  const renderErrorContent = () => {
    return (
      <div
        className={`h-full w-full divide-y divide-gray-300 border border-slate-200 dark:divide-gray-700 dark:border-gray-700 ${className}`}
      >
        <div className="flex w-full flex-col space-y-8 p-4 text-left text-sm">
          <div className="flex w-full flex-col space-y-1 text-left text-sm">
            <p className="text-sm font-semibold">
              Response <span className="text-xs text-red-500">(Error)</span>
            </p>
            {mode === "Debug" ? (
              <pre className="h-full overflow-auto whitespace-pre-wrap rounded-md border p-2 leading-6">
                {JSON.stringify(mapperContent, null, 2)}
              </pre>
            ) : mode === "JSON" ? (
              <pre className="h-full overflow-auto whitespace-pre-wrap rounded-md border p-2 leading-6">
                {JSON.stringify(mapperContent.raw.response, null, 2)}
              </pre>
            ) : errorData.type === "parse_error" ? (
              <div className="rounded-md border bg-destructive/10 p-4 dark:bg-destructive/20">
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
                      <div className="font-mono max-h-60 overflow-auto rounded-md bg-destructive/5 p-2 text-xs dark:bg-destructive/10">
                        {errorData.details}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (mapperContent.raw.response as any)?.error ===
              "HTML response detected:" ? (
              <pre className="h-full overflow-auto whitespace-pre-wrap rounded-md border p-2 leading-6">
                <SafeHtmlRenderer
                  html={(mapperContent.raw.response as any)?.html_response}
                />
              </pre>
            ) : (
              <pre className="h-full overflow-auto whitespace-pre-wrap rounded-md border p-2 leading-6">
                {errorData.message}
              </pre>
            )}
          </div>
          <p className="text-sm font-semibold">Request</p>
          <pre className="h-full overflow-auto whitespace-pre-wrap rounded-md border p-2 leading-6">
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
        <div className="h-full w-[80vw] divide-y divide-gray-300 rounded-md dark:divide-gray-700">
          {renderErrorContent(true)}
        </div>
      </ThemedModal>
    </>
  );
};
