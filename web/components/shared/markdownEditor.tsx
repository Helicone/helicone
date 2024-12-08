import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import {
  ResizablePanel,
  ResizableHandle,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useMemo } from "react";

interface MarkdownEditorProps {
  text: string;
  setText: (text: string) => void;
  language: "json" | "markdown";
  disabled?: boolean;
  className?: string;
  textareaClassName?: string;
}

const MAX_EDITOR_HEIGHT = 1000;
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

  const editorHeight = useMemo(() => {
    const lineHeight = 18; // approximate line height in pixels
    const lineCount = (text.match(/\n/g) || []).length + 1;
    const minHeight = 50; // minimum height in pixels
    return Math.min(
      MAX_EDITOR_HEIGHT,
      Math.max(minHeight, lineCount * lineHeight + 20)
    );
  }, [text]);

  return (
    <MonacoEditor
      value={text}
      onChange={(value) => setText(value || "")}
      language={language}
      theme={currentTheme === "dark" ? "vs-dark" : "vs-light"}
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
      height={editorHeight}
    />
  );
};

export default MarkdownEditor;
