import React from "react";
import "prismjs/themes/prism.css";
import Prism, { defaultProps, Language } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/nightOwl";
import { clsx } from "../../shared/clsx";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import useNotification from "../../shared/notification/useNotification";

const LANG_MAPPINGS: Record<string, Language> = {
  typescript: "typescript",
  javascript: "javascript",
  bash: "bash",
  shell: "bash",
  python: "python",
  curl: "bash",
  langchain_python: "python",
  langchain_javascript: "javascript",
  langchain_typescript: "typescript",
};

interface DiffHighlightProps {
  code: string;
  language: keyof typeof LANG_MAPPINGS;
  newLines: number[];
  oldLines: number[];
  minHeight?: boolean; // should this code block have a min height?
  maxHeight?: boolean;
  textSize?: "sm" | "md" | "lg";
  className?: string;
  marginTop?: boolean;
}

export function DiffHighlight(props: DiffHighlightProps) {
  const {
    minHeight = true,
    maxHeight = true,
    textSize = "md",
    className,
    marginTop = true,
  } = props;

  const { setNotification } = useNotification();

  return (
    <div className={clsx("ph-no-capture w-full overflow-auto", className)}>
      <Prism
        {...defaultProps}
        code={props.code.trim()}
        language={LANG_MAPPINGS[props.language] ?? "typescript"}
        theme={theme}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <>
            <pre
              className={clsx(
                textSize === "sm" && "text-xs",
                textSize === "md" && "text-xs md:text-sm",
                textSize === "lg" && "text-md md:text-lg",
                minHeight ? "min-h-[300px] md:min-h-[300px]" : "",
                "p-6 rounded-xl overflow-auto relative space-y-0.5",
                maxHeight ? "max-h-[240px]" : "",
                marginTop && "mt-3"
              )}
              style={style}
            >
              <button
                className="absolute top-4 right-4 z-50"
                onClick={() => {
                  setNotification("Copied to clipboard", "success");
                  navigator.clipboard.writeText(props.code);
                }}
              >
                <ClipboardIcon className="w-5 h-5 text-gray-500" />
              </button>
              {tokens.map((line, i) => {
                const { key: _, ...lineProps } = getLineProps({ line, key: i });
                const lineNumber = i;
                const newLine = props.newLines.includes(lineNumber);
                const oldLine = props.oldLines.includes(lineNumber);
                let lineClasses = "flex";
                if (newLine) lineClasses += " bg-green-500 bg-opacity-40";
                if (oldLine) lineClasses += " bg-red-800 bg-opacity-40";

                return (
                  <div key={i} {...lineProps} className={lineClasses}>
                    <code className="flex-1">
                      {line.map((token, key) => {
                        const { key: _, ...tokenProps } = getTokenProps({
                          token,
                          key,
                        });
                        if (
                          token.content === "=" ||
                          token.content === ":" ||
                          token.content === "<" ||
                          token.content === ">" ||
                          "=>"
                        ) {
                          tokenProps.className = "";
                        }
                        return <span key={key} {...tokenProps} />;
                      })}
                    </code>
                  </div>
                );
              })}
            </pre>
          </>
        )}
      </Prism>
    </div>
  );
}
