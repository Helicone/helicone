import React from "react";
import Prism, { defaultProps } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/vsDark";

interface DiffHighlightProps {
  code: string;
  language: string;
  newLines: number[];
  oldLines: number[];
}

export function DiffHighlight(props: DiffHighlightProps) {
  return (
    <div className="bg-black ph-no-capture w-full overflow-auto">
      <Prism
        {...defaultProps}
        code={props.code.trim()}
        language="typescript"
        theme={theme}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`${className} p-4 rounded bg-black`} style={style}>
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
                const className = " bg-green-800 bg-opacity-40";
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
        )}
      </Prism>
    </div>
  );
}
