import { StateMessage } from "@/types/prompt-state";

export default function autoImprovePrompt(messages: StateMessage[]) {
  const formattedMessages = messages
    .map((msg) => `<${msg.role}>\n${msg.content}\n</${msg.role}>`)
    .join("\n\n");

  const formattedRoles = messages
    .map((msg) => `<improved_${msg.role}>...</improved_${msg.role}>`)
    .join("\n\n");

  const system = `You are a world-class prompt-engineer tasked with examining and then providing the next and improved version of the following LLM prompt:
<llm_prompt>
${formattedMessages}
</llm_prompt>

When thinking, ALWAYS follow these instructions:
<thinking_instructions>
- Go sentence by sentence:
  1. HOW do you interpret this sentence when first reading it?
  2. WHAT do you think was the instructional intent the writer had when they wrote this sentence?
  3. WHICH parts of this sentence should change to better align with the instructional intent of the writer?
</thinking_instructions>`;

  const user = `After thinking, respond ONLY in the following format:
${formattedRoles}`;

  return { system, user };
}
