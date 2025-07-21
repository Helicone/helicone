import React from "react";
import { Highlight, Token, themes } from "prism-react-renderer";
import { ClipboardIcon } from "@heroicons/react/24/outline";

interface DiffHighlightProps {
  code: string;
  language: string;
}

export function DiffHighlight(props: DiffHighlightProps) {
  const { code, language } = props;

  return (
    <div className="ph-no-capture w-full overflow-auto rounded-b-2xl">
      <Highlight theme={themes.jettwaveDark} code={code} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre style={style} className="max-h-96 overflow-auto p-6 leading-7">
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                <span className="pr-4 text-gray-500">{i + 1}</span>
                {line.map((token, key) => {
                  if (
                    token.content.includes("https://oai.helicone.ai") ||
                    token.content.includes("https://anthropic.helicone.ai")
                  ) {
                    return (
                      <span
                        key={key}
                        className={
                          "text-sky-400 underline decoration-dashed underline-offset-4"
                        }
                      >
                        {token.content}
                      </span>
                    );
                  } else {
                    return <span key={key} {...getTokenProps({ token })} />;
                  }
                })}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
