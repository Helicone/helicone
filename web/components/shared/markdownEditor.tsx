import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-markup-templating";
import "prismjs/themes/prism.css";
import Editor from "react-simple-code-editor";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";

const MAX_EDITOR_HEIGHT = 500;
const MonacoMarkdownEditor = (props: MarkdownEditorProps) => {
  const {
    text,
    setText,
    language,
    disabled = false,
    className,
    textareaClassName,
    containerClassName,
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
    <div className={containerClassName}>
      <MonacoEditor
        value={typeof text === "string" ? text : JSON.stringify(text)}
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
      <i className="text-xs text-gray-500">
        Helicone: Large text detected, falling back to large text editor
      </i>
    </div>
  );
};

interface MarkdownEditorProps {
  text: string | object;
  setText: (text: string) => void;
  language: "json" | "markdown" | "python";
  disabled?: boolean;
  className?: string;
  textareaClassName?: string;
  monaco?: boolean;
  id?: string;
  placeholder?: string;
  containerClassName?: string;
}

const LARGE_TEXT_THRESHOLD = 20;

const LARGE_TEXT_THRESHOLD_CHARS = 10_000;

const MarkdownEditor = (props: MarkdownEditorProps) => {
  const {
    text: noSafeText,
    setText,
    language,
    disabled = false,
    className,
    textareaClassName,
    monaco = false,
    id,
    placeholder,
  } = props;

  const text = useMemo(() => {
    if (typeof noSafeText === "string") {
      return noSafeText;
    }
    return JSON.stringify(noSafeText, null, 2);
  }, [noSafeText]);

  const languageMap = {
    json: {
      lang: languages.json,
      ref: "json",
    },
    markdown: {
      lang: languages.markdown,
      ref: "markdown",
    },
    python: {
      lang: languages.python,
      ref: "python",
    },
  };

  const { lang, ref } = languageMap[language];

  if (
    text.split("\n").length > LARGE_TEXT_THRESHOLD ||
    monaco ||
    text.length > LARGE_TEXT_THRESHOLD_CHARS
  ) {
    return <MonacoMarkdownEditor {...props} />;
  }

  return (
    <Editor
      placeholder={placeholder}
      {...(id && { id })}
      value={text}
      onValueChange={setText}
      highlight={(code) => {
        if (!code) return "";
        if (typeof code !== "string") return "";
        return highlight(code, lang, ref);
      }}
      padding={16}
      className={
        className ??
        `text-sm text-black dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg whitespace-pre-wrap `
      }
      textareaClassName={textareaClassName ?? ""}
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
