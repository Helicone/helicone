import type { AuthorMetadata } from "../../types";
import { ornithAiModels } from "./index";

export const ornithAiMetadata = {
  modelCount: Object.keys(ornithAiModels).length,
  supported: true,
  name: "Ornith AI",
  slug: "ornith-ai",
  website: "https://huggingface.co/ornith-ai",
} satisfies AuthorMetadata;
