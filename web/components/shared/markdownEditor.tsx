import React, { useState } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-markup-templating";

interface MarkdownEditorProps {
  text: string;
  setText: (text: string) => void;
}

const MarkdownEditor = (props: MarkdownEditorProps) => {
  const { text, setText } = props;

  return (
    <Editor
      value={text}
      onValueChange={setText}
      highlight={(code) => highlight(code, languages.markdown, "markdown")}
      padding={10}
      className="text-sm border border-gray-300 dark:border-gray-700 rounded-lg"
      // mono font
      style={{
        fontFamily: '"Fira Code", "Fira Mono", monospace',
        fontSize: 12,
      }}
    />
  );
};

export default MarkdownEditor;
