import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import {
  ResizablePanel,
  ResizableHandle,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useMemo, useRef, useState } from "react";
import { editor } from "monaco-editor";

interface MarkdownEditorProps {
  text: string;
  setText: (text: string) => void;
  language: "json" | "markdown";
  disabled?: boolean;
  className?: string;
  textareaClassName?: string;
}

const MAX_EDITOR_HEIGHT = 500;
const MarkdownEditor = (props: MarkdownEditorProps) => {
  const {
    text,
    setText,
    language,
    disabled = false,
    className,
    textareaClassName,
  } = props;
  const { theme: currentTheme } = useTheme();
  const minHeight = 100;

  const [height, setHeight] = useState(minHeight);
  const updateHeight = (editor: editor.IStandaloneCodeEditor) =>
    setHeight(
      Math.min(
        MAX_EDITOR_HEIGHT,
        Math.max(minHeight, editor.getContentHeight())
      )
    );

  return (
    <MonacoEditor
      value={text}
      onChange={(value) => setText(value || "")}
      language={language}
      theme={currentTheme === "dark" ? "vs-dark" : "vs-light"}
      onMount={(editor) =>
        editor.onDidContentSizeChange(() => updateHeight(editor))
      }
      options={{
        minimap: { enabled: false },
        fontSize: 12,
        fontFamily: '"Fira Code", "Fira Mono", monospace',
        readOnly: disabled,
        wordWrap: "on",
        lineNumbers: "off",
        language: "markdown",
        scrollBeyondLastLine: false, // Prevents extra space at bottom
        automaticLayout: true, // Enables auto-resizing
      }}
      className={className}
      height={height}
    />
  );
};

export default MarkdownEditor;
