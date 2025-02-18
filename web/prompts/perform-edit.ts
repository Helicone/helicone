export default function performEditPrompt(
  editGoal: string,
  editTarget: string,
  contextBefore: string,
  contextAfter: string
) {
  const system = `You are a world-class prompt editor, tasked with making very specific and targeted edit goal to only an edit target of a high-performance LLM prompt.

<edit_goal>
${editGoal}
</edit_goal>`;

  const user = `<context>
${contextBefore}
<edit_target>
${editTarget}
</edit_target>
${contextAfter}
</context>

Reply ONLY with the edited target.`;

  const prefill = `Here is ONLY the edited target according to the edit goal:
<edited_target>`;

  return { system, user, prefill };
}

export const suggestions = [
  {
    label: "Synonym",
    goal: "Replace with a more suitable alternative by: 1) considering context and intent, 2) matching formality level, 3) preserving technical accuracy, and 4) ensuring semantic equivalence. The replacement should carry the same core meaning but be more effective.",
    condition: (text: string) => {
      // Max weight (3) for 1-2 words, 0 otherwise
      const wordCount = text.trim().split(/\s+/).length;
      return wordCount <= 2 ? 3 : 0;
    },
  },
  {
    label: "Clarity",
    goal: "Enhance clarity and comprehension by: 1) replacing ambiguous words with precise alternatives, 2) simplifying complex phrases, 3) using consistent terminology, and 4) restructuring for logical flow. Each sentence should be immediately understandable to any LLM.",
    condition: (text: string) => {
      // Weight based on presence of complex words and long sentences
      const complexWords = text.match(/\b\w{12,}\b/g)?.length || 0;
      const longSentences = text
        .split(/[.!?]/)
        .filter((s) => s.split(" ").length > 20).length;
      return complexWords + longSentences;
    },
  },
  {
    label: "Shorten",
    goal: "Increase impact through concision by: 1) eliminating redundant information, 2) replacing verbose phrases with powerful alternatives, 3) removing qualifier words (very, quite, etc.), and 4) merging related ideas. Every remaining word should carry significant meaning.",
    condition: (text: string) => {
      // Weight based on text being longer than the lengthen cutoff
      return text.length > 100 ? 2 : 0;
    },
  },
  {
    label: "Lengthen",
    goal: "Enrich the content by: 1) adding relevant context and examples, 2) explaining key concepts in more detail, 3) addressing potential questions or concerns, and 4) incorporating supporting evidence. Each addition should meaningfully enhance understanding.",
    condition: (text: string) => {
      // Weight based on text being too short
      return text.length < 100 ? 2 : 0;
    },
  },
];
