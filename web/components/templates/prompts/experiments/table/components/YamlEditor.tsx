"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";

export default function Component() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<any>(null);
  const [yamlContent, setYamlContent] = useState(`name123: null
user_name: null
name: null
user_name: null
asdasd: dasdjehe
test: 12312Create nextjs component where
  we can edit text in kinda yaml file and
  highlight a keys. But keys and variables
  will be without nesting`);

  useEffect(() => {
    let monaco: typeof import("monaco-editor");

    const initMonaco = async () => {
      if (editorRef.current && !editor) {
        monaco = await import("monaco-editor");

        // Define custom theme
        monaco.editor.defineTheme("yamlTheme", {
          base: "vs-dark",
          inherit: true,
          rules: [
            { token: "keyword", foreground: "C678DD" },
            { token: "string", foreground: "98C379" },
            { token: "number", foreground: "D19A66" },
            { token: "delimiter", foreground: "ABB2BF" },
          ],
          colors: {
            "editor.background": "#282C34",
            "editor.foreground": "#ABB2BF",
            "editor.lineHighlightBackground": "#2C313C",
            "editorCursor.foreground": "#528BFF",
            "editorWhitespace.foreground": "#3E4451",
          },
        });

        // Register custom language
        monaco.languages.register({ id: "yaml" });

        // Define custom tokens
        monaco.languages.setMonarchTokensProvider("yaml", {
          tokenizer: {
            root: [
              [/^[^:]+(?=:)/, "keyword"],
              [/:\s*(.*)$/, "string"],
              [/\d+/, "number"],
              [/[,:]/, "delimiter"],
            ],
          },
        });

        const newEditor = monaco.editor.create(editorRef.current, {
          value: yamlContent,
          language: "yaml",
          theme: "yamlTheme",
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
        });

        newEditor.onDidChangeModelContent(() => {
          setYamlContent(newEditor.getValue());
        });

        setEditor(newEditor);
      }
    };

    initMonaco();

    return () => {
      if (editor) {
        editor.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (editor) {
      editor.setValue(yamlContent);
    }
  }, [yamlContent]);

  return (
    <Card className="w-full  overflow-hidden border border-border bg-[#282C34]">
      <div ref={editorRef} className="h-[400px] w-full" />
    </Card>
  );
}
