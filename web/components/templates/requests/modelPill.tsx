import { MapperType } from "@helicone-package/llm-mapper/types";
import { getMapperType } from "@helicone-package/llm-mapper/utils/getMapperType";
import { clsx } from "../../shared/clsx";
import { Provider } from "@helicone-package/llm-mapper/types";

interface ModelPillProps {
  model: string;
  provider?: Provider;
}

const ModelPill = (props: ModelPillProps) => {
  const { model, provider } = props;

  const builderType = getMapperType({ model, provider: provider || "OPENAI" });

  const colors = {
    purple:
      "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:ring-purple-800",
    teal: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:ring-teal-800",
    blue: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:ring-blue-800",
    orange:
      "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:ring-orange-800",
    yellow:
      "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:ring-yellow-800",
    indigo:
      "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:ring-indigo-800",
    green:
      "bg-green-50 text-green-700 ring-green-200 dark:bg-green-900 dark:text-green-300 dark:ring-green-800",
    pink: "bg-pink-50 text-pink-700 ring-pink-200 dark:bg-pink-900 dark:text-pink-300 dark:ring-pink-800",
    gray: "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-800",
  };

  // Mapping just for providers that have distinct branding, e.g Meta and Nvidia.
  const providerMapping: Partial<Record<Provider, keyof typeof colors>> = {
    LLAMA: "blue",
    NVIDIA: "green",
    ANTHROPIC: "orange",
    VERCEL: "purple",
  };

  // TODO: mapping for ai gateway provider

  // Default fallback for no provider specified
  const modelMapping: Record<MapperType, keyof typeof colors> = {
    "ai-gateway": "blue",
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
    "openai-response": "purple",
    unknown: "gray",
  };

  const colorKey =
    (provider && providerMapping[provider]) ||
    modelMapping[builderType] ||
    "gray";
  const colorClass = colors[colorKey];

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
