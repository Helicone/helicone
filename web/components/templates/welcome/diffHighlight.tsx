import React from "react";
import Prism, { defaultProps } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/nightOwl";
import { clsx } from "../../shared/clsx";
import { text } from "stream/consumers";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import useNotification from "../../shared/notification/useNotification";

interface DiffHighlightProps {
  code: string;
  language: string;
  newLines: number[];
  oldLines: number[];
  minHeight?: boolean; // should this code block have a min height?
  textSize?: "sm" | "md" | "lg";
}

export function DiffHighlight(props: DiffHighlightProps) {
  const { minHeight = true, textSize = "md" } = props;

  const { setNotification } = useNotification();

  return (
    <div className={clsx("ph-no-capture w-full overflow-auto")}>
      <Prism
        {...defaultProps}
        code={props.code.trim()}
        language="typescript"
        theme={theme}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <>
            <pre
              className={clsx(
                className,
                textSize === "sm" && "text-xs",
                textSize === "md" && "text-xs md:text-sm",
                textSize === "lg" && "text-sm md:text-md",
                minHeight ? "min-h-[300px] md:min-h-[420px]" : "",
                "p-6 rounded-xl mt-3 overflow-auto relative"
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
                const lineProps = getLineProps({ line, key: i });
                const newLine =
                  props.newLines &&
                  props.newLines.length > 0 &&
                  props.newLines.find((n) => n === i) !== undefined;
                const oldLine =
                  props.oldLines &&
                  props.oldLines.length > 0 &&
                  props.oldLines.find((n) => n === i) !== undefined;
                if (newLine) {
                  const className = " bg-green-500 bg-opacity-40";
                  lineProps.className += className;
                }
                if (oldLine) {
                  const className = " bg-red-800 bg-opacity-40";
                  lineProps.className += className;
                }
                return (
                  <div key={i} {...lineProps}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token, key })} />
                    ))}
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
