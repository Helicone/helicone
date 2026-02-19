/**
 * Strips dangerous HTML tags from text content before markdown rendering.
 * Preserves markdown syntax and safe HTML tags (like <b>, <em>, <a>, etc.).
 *
 * This prevents stored XSS via LLM outputs containing malicious HTML
 * (e.g., <iframe srcdoc="<script>document.cookie</script>">).
 *
 * We use regex-based stripping rather than DOMPurify because DOMPurify
 * parses input as HTML, which mangles markdown syntax (backticks,
 * asterisks, brackets, etc.).
 */
export function stripDangerousHtml(text: string): string {
  if (typeof text !== "string") return text;

  const dangerousTags = [
    "script",
    "iframe",
    "object",
    "embed",
    "style",
    "form",
    "input",
    "button",
    "textarea",
    "select",
    "applet",
    "base",
    "link",
    "meta",
    "svg",
    "math",
  ];

  let cleaned = text;

  for (const tag of dangerousTags) {
    // Remove paired tags with content: <tag ...>...</tag>
    const pairedRegex = new RegExp(
      `<\\s*${tag}[^>]*>[\\s\\S]*?<\\s*/\\s*${tag}\\s*>`,
      "gi"
    );
    cleaned = cleaned.replace(pairedRegex, "");

    // Remove self-closing or unclosed: <tag ... /> or <tag ...>
    const selfClosingRegex = new RegExp(`<\\s*${tag}[^>]*/?>`, "gi");
    cleaned = cleaned.replace(selfClosingRegex, "");
  }

  // Remove event handlers from remaining tags (onclick, onload, onerror, etc.)
  cleaned = cleaned.replace(
    /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    ""
  );

  // Remove javascript: protocol in href/src/action attributes
  cleaned = cleaned.replace(
    /(href|src|action)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi,
    '$1=""'
  );

  return cleaned;
}
