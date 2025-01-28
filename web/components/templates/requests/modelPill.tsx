import { getMapperType } from "@/packages/llm-mapper/utils/getMapperType";
import { clsx } from "../../shared/clsx";
import { MapperType } from "@/packages/llm-mapper/types";

interface ModelPillProps {
  model: string;
}

const ModelPill = (props: ModelPillProps) => {
  const { model } = props;

  const builderType = getMapperType({ model, provider: "OPENAI" });

  let modelMapping: Record<MapperType, string> = {
    "openai-chat":
      "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:ring-purple-800",
    "gemini-chat":
      "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:ring-teal-800",
    "openai-moderation":
      "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:ring-teal-800",
    "openai-embedding":
      "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:ring-blue-800",
    "anthropic-chat":
      "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:ring-orange-800",
    "openai-image":
      "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:ring-yellow-800",
    "black-forest-labs-image":
      "bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:ring-yellow-800",
    "openai-assistant":
      "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:ring-purple-800",
    "openai-instruct":
      "bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:ring-purple-800",
    unknown:
      "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-800",
  };

  return (
    <span
      className={clsx(
        modelMapping[builderType] || "bg-gray-50 text-gray-700 ring-gray-200",
        `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
      )}
    >
      {model && model !== "" ? model : "Unsupported"}
    </span>
  );
};

export default ModelPill;
