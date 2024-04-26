import React from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-markup-templating";
import "prismjs/themes/prism.css";

interface MarkdownEditorProps {
  text: string;
  setText: (text: string) => void;
  disabled?: boolean;
}

const MarkdownEditor = (props: MarkdownEditorProps) => {
  const { text, setText, disabled = false } = props;

  return (
    <Editor
      value={text}
      onValueChange={setText}
      highlight={(code) => {
        if (!code) return;
        if (typeof code !== "string") return;
        highlight(code, languages.markdown, "markdown");
      }}
      padding={10}
      className="text-sm border border-gray-300 dark:border-gray-700 rounded-lg"
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
