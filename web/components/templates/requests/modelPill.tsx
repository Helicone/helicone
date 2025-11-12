import { MapperType } from "@helicone-package/llm-mapper/types";
import { getMapperType } from "@helicone-package/llm-mapper/utils/getMapperType";
import { clsx } from "../../shared/clsx";
import { Provider } from "@helicone-package/llm-mapper/types";
import {
  colourPillStyles,
  getModelAuthor,
  getAuthorColor,
  ColorKey,
} from "./colors";

interface ModelPillProps {
  model: string;
  provider?: Provider;
}

const ModelPill = (props: ModelPillProps) => {
  const { model, provider } = props;

  const builderType = getMapperType({ model, provider: provider || "OPENAI" });

  // Model-specific color mappings based on the mapper type
  const modelMapping: Record<MapperType, ColorKey> = {
    "ai-gateway-chat": "blue",
    "ai-gateway-responses": "blue",
    "openai-chat": "purple",
    "gemini-chat": "teal",
    "vercel-chat": "purple",
    "openai-moderation": "teal",
    "openai-embedding": "blue",
    "anthropic-chat": "orange",
    "llama-chat": "blue",
    "openai-image": "yellow",
    "black-forest-labs-image": "yellow",
    "openai-assistant": "purple",
    "openai-instruct": "purple",
    "openai-realtime": "indigo",
    "vector-db": "green",
    tool: "pink",
    data: "blue",
    "openai-response": "purple",
    unknown: "gray",
  };

  // Determine color: author-based first, then model-type fallback
  const author = getModelAuthor(model);
  const colorKey = author
    ? getAuthorColor(author)
    : modelMapping[builderType] || "blue";
  const colorClass = colourPillStyles[colorKey];

  return (
    <span
      className={clsx(
        colorClass,
        `-my-1 w-max items-center truncate rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset`,
      )}
    >
      {model && model !== "" ? model : "Unsupported"}
    </span>
  );
};

export default ModelPill;
