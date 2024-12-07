import { Editor as MonacoEditor } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import {
  ResizablePanel,
  ResizableHandle,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

interface MarkdownEditorProps {
  text: string;
  setText: (text: string) => void;
  language: "json" | "markdown";
  disabled?: boolean;
  className?: string;
  textareaClassName?: string;
}

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

  return (
    <ResizablePanelGroup direction="vertical" className="min-h-[500px]">
      <ResizablePanel defaultSize={75}>
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
          }}
          className={className}
          height="100%"
        />
      </ResizablePanel>
      <ResizableHandle />
    </ResizablePanelGroup>
  );
};

export default MarkdownEditor;
