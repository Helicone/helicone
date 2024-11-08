"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function InputEditor() {
  const [content, setContent] = useState(`name123: null
user_name: null
name: null
user_name: null
asdasd: dasdjehe
test: 12312Create nextjs component where
  we can edit text in kinda yaml file and
  highlight keys. But keys and variables
  will be without nesting`);

  const editorRef = useRef<HTMLDivElement>(null);

  // Function to escape HTML characters
  const escapeHTML = (str: string) => {
    return str.replace(/[&<>"']/g, (char) => {
      const escapeChars: { [key: string]: string } = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return escapeChars[char] || char;
    });
  };

  // Function to highlight YAML-like syntax
  const highlightYAML = (text: string) => {
    return text
      .split(/\n/)
      .map((line) => {
        const [key, ...rest] = line.split(":");
        if (rest.length) {
          const restOfLine = rest.join(":");
          return `<span style="color: #C678DD;">${escapeHTML(
            key
          )}</span>:${escapeHTML(restOfLine)}`;
        }
        return escapeHTML(line);
      })
      .join("\n");
  };

  // Function to get cursor position
  const getCaretCharacterOffsetWithin = (element: Node) => {
    let caretOffset = 0;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    }
    return caretOffset;
  };

  // Function to set cursor position
  const setCaretPosition = (element: Node, offset: number) => {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    let charIndex = 0;
    let nodeStack = [element];
    let node: Node | undefined;

    while (nodeStack.length > 0 && (node = nodeStack.pop())) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        const nextCharIndex = charIndex + text.length;
        if (offset >= charIndex && offset <= nextCharIndex) {
          range.setStart(node, offset - charIndex);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          return;
        }
        charIndex = nextCharIndex;
      } else {
        let i = node.childNodes.length;
        while (i--) {
          nodeStack.push(node.childNodes[i]);
        }
      }
    }
  };

  // Handle input event to update content and cursor
  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const newContent = event.currentTarget.innerText || "";
    if (editorRef.current) {
      const caretOffset = getCaretCharacterOffsetWithin(editorRef.current);

      setContent(newContent);

      requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = highlightYAML(newContent);
          setCaretPosition(editorRef.current, caretOffset);
        }
      });
    }
  };

  // Initialize editor content with highlighting
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = highlightYAML(content);
    }
  }, []);

  return (
    <Card className="w-full overflow-hidden border border-border bg-[#282C34] p-4">
      <Label htmlFor="yaml-editor" className="sr-only">
        YAML Editor
      </Label>
      <div
        ref={editorRef}
        id="yaml-editor"
        contentEditable
        onInput={handleInput}
        className="h-[400px] w-full overflow-auto whitespace-pre-wrap break-words text-sm text-[#ABB2BF] outline-none"
        style={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}
        role="textbox"
        aria-multiline="true"
      />
    </Card>
  );
}
