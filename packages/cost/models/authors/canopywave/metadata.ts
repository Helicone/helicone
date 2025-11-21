import type { AuthorMetadata } from "../../types";
import { canopywaveModels } from "./index";

export const canopywaveMetadata = {
  modelCount: Object.keys(canopywaveModels).length,
  supported: true,
} satisfies AuthorMetadata;
