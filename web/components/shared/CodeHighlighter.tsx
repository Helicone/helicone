import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { Copy, Check } from "lucide-react";
import useNotification from "./notification/useNotification";
import DOMPurify from "dompurify";

interface CodeHighlighterProps {
  code: string;
  language: string;
  theme?: string;
}

export function CodeHighlighter({
  code,
  language,
  theme = "github-dark",
}: CodeHighlighterProps) {
  const [html, setHtml] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { setNotification } = useNotification();

  useEffect(() => {
    async function highlight() {
      try {
        const highlightedHtml = await codeToHtml(code, {
          lang: language,
          theme: theme,
        });
        // Sanitize the HTML to prevent XSS attacks
        const sanitizedHtml = DOMPurify.sanitize(highlightedHtml, {
          ALLOWED_TAGS: ['pre', 'code', 'span', 'div'],
          ALLOWED_ATTR: ['class', 'style', 'data-*'],
        });
        setHtml(sanitizedHtml);
      } catch (error) {
        console.error("Error highlighting code:", error);
        // Fallback to plain text with proper escaping
        const escapedCode = code
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
        setHtml(`<pre><code>${escapedCode}</code></pre>`);
      }
    }
    highlight();
  }, [code, language, theme]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setNotification("Code copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setNotification("Failed to copy code", "error");
    }
  };

  return (
    <div className="group relative w-full overflow-hidden rounded-lg">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 z-10 rounded-md bg-gray-800 p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-700 hover:text-gray-300 group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
      <div
        className="w-full overflow-x-auto [&>pre]:!m-0 [&>pre]:!rounded-lg [&>pre]:!p-4 [&>pre]:text-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
