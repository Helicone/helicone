import { usePromptVersions } from "../../../../../services/hooks/prompts/prompts";

type NotNull<T> = T extends null ? never : T;
type NotUndefined<T> = T extends undefined ? never : T;

export type Prompt = NotNull<
  NotUndefined<ReturnType<typeof usePromptVersions>["prompts"]>
>[number];
