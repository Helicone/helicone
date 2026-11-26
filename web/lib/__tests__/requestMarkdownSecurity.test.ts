// Run with: npx tsx --test web/lib/__tests__/requestMarkdownSecurity.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Streamdown } from "streamdown";
import { preserveLineBreaksForMarkdown } from "../textHelpers";

function renderRequestContent(content: string): string {
  return renderToStaticMarkup(
    createElement(
      Streamdown,
      { mode: "static" },
      preserveLineBreaksForMarkdown(content),
    ),
  );
}

describe("request markdown security", () => {
  it("removes raw iframe srcdoc content after parsing", () => {
    const html = renderRequestContent(
      '<iframe srcdoc="&lt;p&gt;INERT_MARKER&lt;/p&gt;"></iframe>',
    );

    assert.doesNotMatch(html, /<iframe|srcdoc/i);
  });

  it("blocks entity-encoded script URLs", () => {
    const html = renderRequestContent(
      '<a href="&#x6a;avascript:INERT_MARKER">click</a>',
    );

    assert.doesNotMatch(html, /href="javascript:/i);
  });

  it("preserves markdown links and safe inline HTML", () => {
    const html = renderRequestContent(
      "**bold** [docs](https://helicone.ai) <em>italic</em>",
    );

    assert.match(html, /bold/);
    assert.match(html, /href="https:\/\/helicone\.ai\//);
    assert.match(html, /<em>italic<\/em>/);
  });
});
