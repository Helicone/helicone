import React from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-markup-templating";
import "prismjs/themes/prism.css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";

interface MarkdownEditorProps {
  text: string;
  setText: (text: string) => void;
  language: "json" | "markdown";
  disabled?: boolean;
}

const MarkdownEditor = (props: MarkdownEditorProps) => {
  const { text, setText, language, disabled = false } = props;

  const languageMap = {
    json: {
      lang: languages.json,
      ref: "json",
    },
    markdown: {
      lang: languages.markdown,
      ref: "markdown",
    },
  };

  const { lang, ref } = languageMap[language];

  return (
    <Editor
      value={text}
      onValueChange={setText}
      highlight={(code) => {
        if (!code) return "";
        if (typeof code !== "string") return "";
        return highlight(code, lang, ref);
      }}
      padding={16}
      className="text-sm text-black dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg whitespace-pre-wrap"
      // mono font
      style={{
        fontFamily: '"Fira Code", "Fira Mono", monospace',
        fontSize: 12,
      }}
      disabled={disabled}
    />
  );
};

export default MarkdownEditor;
