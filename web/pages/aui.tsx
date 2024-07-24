"use client";

import { AssistantPlayground } from "@assistant-ui/react-playground";
import { usePlaygroundRuntime } from "@assistant-ui/react-playground";
import { AssistantRuntimeProvider } from "@assistant-ui/react";

// Update Prism.js import

import "prismjs";
import "prismjs/components/prism-json";
import "prismjs/themes/prism.css";
import React from "react";

const models = ["gpt-3.5-turbo", "gpt-4", "gpt-4o"];

export default function Home() {
  // 2.
  const runtime = usePlaygroundRuntime({
    api: "/api/chat", // TODO update this
    initialMessages: [],
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AssistantPlayground modelSelector={{ models }} />
    </AssistantRuntimeProvider>
  );
}
