import type { AuthorMetadata } from "../../types";
import { zaiModels } from "./index";

export const zaiMetadata = {
  modelCount: Object.keys(zaiModels).length,
  supported: true,
} satisfies AuthorMetadata;
