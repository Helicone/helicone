export function autoCompletePrompt(currentText: string, contextText: string) {
  const textWithContext = `${
    contextText ? `${contextText}\n\n` : ''
  }${currentText}`;

  const system = `You are a world-class prompt-engineer that writes ONLY the next imidiately relevant part of LLM prompts that are clear, precise, and follow highly performant prompt patterns.

<highly_performant_prompt_patterns>
- Start with role/capability definitions.
- Use clear, measurable constraints.
- Instructions are great, but accurate examples are much better.
- Always structure complex parts into labeled sections using delimiters such as <context>, <instruction>, <example>, etc.
- Maximize clarity per word, and use as few words as possible.
- Always end with strict response format instructions.
</highly_performant_prompt_patterns>

<response_format>
- Continue the text DIRECTLY without any special characters or formatting.
- Write as if you are the original author, not suggesting options.
- You are in AUTO-COMPLETE mode. Your ONLY task is to continue the exact text provided, adding the next best imidiately relevant part and very quickly finding a natural stopping point.
- DO NOT respond with ANYTHING ELSE.
</response_format>`;

  const user = `Please start with: "${textWithContext}"...`;

  const prefill = textWithContext;

  return { system, user, prefill };
}
