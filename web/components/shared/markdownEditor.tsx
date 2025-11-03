import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markup-templating";
import "prismjs/themes/prism.css";
import Editor from "react-simple-code-editor";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useTheme } from "next-themes";
import { useMemo, useState, useEffect, useRef } from "react";
import { TEMPLATE_REGEX, PROMPT_PARTIAL_REGEX } from "@helicone-package/prompts/templates";
import { useVariableColorMapStore } from "@/store/features/playground/variableColorMap";
import { HeliconeTemplateManager } from "@helicone-package/prompts/templates";

const MAX_EDITOR_HEIGHT = 1000000;
const MonacoMarkdownEditor = (props: MarkdownEditorProps) => {
  const {
    text,
    setText,
    language,
    disabled = false,
    className,
    containerClassName,
    monacoOptions,
    showLargeTextWarning = true,
  } = props;
  const { theme: currentTheme } = useTheme();
  const minHeight = 100;
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const [height, setHeight] = useState(minHeight);
  const updateHeight = (editor: editor.IStandaloneCodeEditor) =>
    setHeight(
      Math.min(
        MAX_EDITOR_HEIGHT,
        Math.max(minHeight, editor.getContentHeight()),
      ),
    );

  // Update theme when currentTheme changes
  useEffect(() => {
    if (
      editorRef.current &&
      typeof window !== "undefined" &&
      (window as any).monaco
    ) {
      const monaco = (window as any).monaco;
      monaco.editor.setTheme(
        currentTheme === "dark" ? "custom-dark" : "custom-light",
      );
    }
  }, [currentTheme]);

  return (
    <div className={containerClassName}>
      <MonacoEditor
        value={typeof text === "string" ? text : JSON.stringify(text)}
        onChange={(value) => setText(value || "")}
        language={language}
        theme={currentTheme === "dark" ? "vs-dark" : "vs-light"}
        onMount={(editor) => {
          editorRef.current = editor;
          editor.onDidContentSizeChange(() => updateHeight(editor));

          // Define custom theme with transparent background
          if (typeof window !== "undefined" && (window as any).monaco) {
            const monaco = (window as any).monaco;
            monaco.editor.defineTheme("custom-dark", {
              base: "vs-dark",
              inherit: true,
              rules: [],
              colors: {
                "editor.background": "#00000000", // Transparent background
              },
            });
            monaco.editor.defineTheme("custom-light", {
              base: "vs",
              inherit: true,
              rules: [],
              colors: {
                "editor.background": "#00000000", // Transparent background
              },
            });
            // Apply the custom theme
            monaco.editor.setTheme(
              currentTheme === "dark" ? "custom-dark" : "custom-light",
            );
          }
        }}
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
          scrollbar: {
            alwaysConsumeMouseWheel: false, // Prevents scroll lock - allows scroll to bubble up to parent
            handleMouseWheel: true,
            vertical: "auto",
            horizontal: "auto",
          },
          ...(monacoOptions ?? {}),
        }}
        className={className}
        height={height}
      />
      {showLargeTextWarning && (
        <i className="text-xs text-gray-500">
          Helicone: Large text detected, falling back to large text editor
        </i>
      )}
    </div>
  );
};

interface MarkdownEditorProps {
  text: string | object;
  setText: (text: string) => void;
  language: "json" | "markdown" | "python" | "yaml";
  disabled?: boolean;
  className?: string;
  textareaClassName?: string;
  monaco?: boolean;
  id?: string;
  placeholder?: string;
  containerClassName?: string;
  monacoOptions?: editor.IStandaloneEditorConstructionOptions;
  showLargeTextWarning?: boolean;
}

const LARGE_TEXT_THRESHOLD = 100;

const LARGE_TEXT_THRESHOLD_CHARS = 20_000;

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
    yaml: {
      lang: languages.yaml,
      ref: "yaml",
    },
  };

  const { lang, ref } = languageMap[language];
  const { getColor } = useVariableColorMapStore();

  if (
    text.split("\n").length > LARGE_TEXT_THRESHOLD ||
    monaco ||
    text.length > LARGE_TEXT_THRESHOLD_CHARS
  ) {
    return <MonacoMarkdownEditor {...props} showLargeTextWarning={!monaco} />;
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

        let highlighted = highlight(code, lang, ref);
        if (language === "markdown" || language === "json") {
          highlighted = highlighted.replace(TEMPLATE_REGEX, (match) => {
            const variable = HeliconeTemplateManager.extractVariables(match)[0];
            if (!variable) return match;
            const color = getColor(variable.name);
            return `<span class="font-bold text-${color}">${match}</span>`;
          });
          highlighted = highlighted.replace(PROMPT_PARTIAL_REGEX, (match) => {
            const variable = HeliconeTemplateManager.extractPromptPartialVariables(match)[0];
            if (!variable) return match;
            const color = getColor(variable.raw);
            return `<span class="font-bold text-${color}">${match}</span>`;
          });
        }

        return highlighted;
      }}
      padding={16}
      className={
        className ??
        `whitespace-pre-wrap rounded-lg border border-gray-300 text-sm text-black dark:border-gray-700 dark:text-white`
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
