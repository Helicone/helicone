// Run with: npx tsx --test web/lib/__tests__/requestMarkdownSecurity.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Streamdown } from "streamdown";
import { requestMarkdownRehypePlugins } from "../requestMarkdownPlugins";
import { preserveLineBreaksForMarkdown } from "../textHelpers";

function renderRequestContent(content: string): string {
  return renderToStaticMarkup(
    createElement(
      Streamdown,
      { mode: "static", rehypePlugins: requestMarkdownRehypePlugins },
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

  it("preserves formatted math", () => {
    const html = renderRequestContent("$$E=mc^2$$");

    assert.match(html, /class="katex(?: |")/);
    assert.match(html, /<math/);
  });

  it("keeps footnote links pointed at their IDs", () => {
    const html = renderRequestContent("text[^1]\n\n[^1]: note");

    assert.match(html, /id="user-content-fn-1"/);
    assert.match(html, /href="#user-content-fn-1"/);
    assert.doesNotMatch(html, /user-content-user-content-/);
  });

  it("preserves inline data images", () => {
    const html = renderRequestContent(
      "![image](data:image/png;base64,aGVsbG8=)",
    );

    assert.match(html, /src="data:image\/png;base64,aGVsbG8="/);
  });

  it("rejects active-content data image URLs", () => {
    const html = renderRequestContent(
      "![image](data:text/html;base64,aGVsbG8=)",
    );

    assert.doesNotMatch(html, /src="data:text\/html/i);
  });

  it("rejects unprefixed raw HTML IDs and names", () => {
    const html = renderRequestContent('<a id="location" name="location">x</a>');

    assert.doesNotMatch(html, /(?:id|name)="location"/);
  });
});
