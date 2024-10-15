export function getGenericRequestText(requestBody: any): string {
  if (!requestBody) return "";

  // Check for messages array (ChatBuilder, ChatGPTBuilder)
  if (Array.isArray(requestBody.messages)) {
    const lastMessage = requestBody.messages[requestBody.messages.length - 1];
    if (lastMessage) {
      if (typeof lastMessage.content === "string") {
        return lastMessage.content;
      } else if (Array.isArray(lastMessage.content)) {
        return lastMessage.content
          .map((item: any) => item?.text || "")
          .join("\n");
      }
    }
  }

  // Check for prompt (GPT3Builder, CompletionBuilder)
  if (typeof requestBody.prompt === "string") {
    return requestBody.prompt;
  }

  // Check for input (EmbeddingBuilder, ModerationBuilder)
  if (typeof requestBody.input === "string") {
    return requestBody.input;
  } else if (Array.isArray(requestBody.input)) {
    return requestBody.input.join("\n");
  }

  // Check for content (some custom implementations)
  if (typeof requestBody.content === "string") {
    return requestBody.content;
  }

  // Check for text (some custom implementations)
  if (typeof requestBody.text === "string") {
    return requestBody.text;
  }

  // Check for system and messages combination (Anthropic style)
  if (
    typeof requestBody.system === "string" &&
    Array.isArray(requestBody.messages)
  ) {
    return `${requestBody.system}\n\n${requestBody.messages
      .map((m: any) => m?.content ?? "")
      .join("\n")}`;
  }

  // If all else fails, stringify the entire requestBody
  return JSON.stringify(requestBody);
}

export function getGenericResponseText(
  responseBody: any,
  statusCode: number
): string {
  if (!responseBody) return "";

  // Handle pending or null status
  if (statusCode === 0 || statusCode === null) {
    return "";
  }

  // Check for error messages
  if (responseBody.error) {
    return responseBody.error.message || JSON.stringify(responseBody.error);
  }

  // Check for choices array (ChatGPTBuilder, GPT3Builder)
  if (Array.isArray(responseBody.choices) && responseBody.choices.length > 0) {
    const choice = responseBody.choices[0];
    if (choice.message) {
      if (choice.message.content) {
        return choice.message.content;
      } else if (choice.message.tool_calls) {
        // Handle tool calls
        return choice.message.tool_calls
          .map((tool: any) => {
            if (tool.function) {
              return `${tool.function.name}(${tool.function.arguments})`;
            }
            return JSON.stringify(tool);
          })
          .join("\n");
      }
    }
    if (choice.text) {
      return choice.text;
    }
  }

  // Check for content array (ClaudeBuilder)
  if (Array.isArray(responseBody.content)) {
    const textContent = responseBody.content.find(
      (item: any) => item.type === "text"
    );
    if (textContent) {
      return textContent.text || "";
    }
  }

  // Check for completion (ClaudeBuilder fallback)
  if (responseBody.completion) {
    return responseBody.completion;
  }

  // Check for data array (EmbeddingBuilder)
  if (Array.isArray(responseBody.data) && responseBody.data.length > 0) {
    if (responseBody.data[0].embedding) {
      return JSON.stringify(responseBody.data[0].embedding);
    }
  }

  // Check for results (ModerationBuilder)
  if (responseBody.results) {
    return JSON.stringify(responseBody.results, null, 2);
  }

  // Check for text (CustomBuilder)
  if (responseBody.text) {
    return typeof responseBody.text === "string"
      ? responseBody.text
      : JSON.stringify(responseBody.text, null, 2);
  }

  // Check for DALL-E specific response
  if (
    responseBody.data &&
    responseBody.data[0] &&
    responseBody.data[0].revised_prompt
  ) {
    return responseBody.data[0].revised_prompt;
  }

  // If all else fails, stringify the entire responseBody
  return JSON.stringify(responseBody, null, 2);
}
