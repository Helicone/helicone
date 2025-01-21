export default function autoCompletePrompt(
  currentText: string,
  contextText: string
) {
  const textWithContext = `${
    contextText ? `${contextText}\n\n` : ""
  }${currentText}`;

  const system = `You are a world-class prompt-engineer that writes ONLY the SINGLE next imidiatly RELEVANT part of an LLM prompt. 

Ensure the next part you write is clear, precise, and follows highly performant prompt patterns while NEVER going beyond the SINGLE next imidiatly RELEVANT part the prompt, which can be just a single word, rest of sentence, or sometimes the whole next section.

<highly_performant_prompt_patterns>
- Use clear, measurable constraints.
- Instructions are great, but accurate response examples are MUCH better.
- Maximize clarity per word, and use as few words as possible.
</highly_performant_prompt_patterns>`;

  const user = `Start with and continue the single next imidiately relevant part from here: "${textWithContext}". DO NOT respond with anything else after the single next imidiately relevant part.`;

  const prefill = `Here is the start of the prompt, the single next imidiately relevant part, and NOTHING ELSE: ${textWithContext}`;

  return { system, user, prefill };
}
