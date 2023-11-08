import { clsx } from "../../shared/clsx";
import { getBuilderType } from "./builder/requestBuilder";

interface ModelPillProps {
  model: string;
}

const ModelPill = (props: ModelPillProps) => {
  const { model } = props;

  const builderType = getBuilderType(model, "OPENAI");

  let modelMapping = {
    ChatBuilder: "bg-purple-50 text-purple-700 ring-purple-200",
    CompletionBuilder: "bg-green-50 text-green-700 ring-green-200",
    ChatGPTBuilder: "bg-purple-50 text-purple-700 ring-purple-200",
    GPT3Builder: "bg-green-50 text-green-700 ring-green-200",
    ModerationBuilder: "bg-teal-50 text-teal-700 ring-teal-200",
    EmbeddingBuilder: "bg-blue-50 text-blue-700 ring-blue-200",
    ClaudeBuilder: "bg-orange-50 text-orange-700 ring-orange-200",
    CustomBuilder: "bg-gray-50 text-gray-700 ring-gray-200",
    UnknownBuilder: "bg-gray-50 text-gray-700 ring-gray-200",
  };

  return (
    <span
      className={clsx(
        modelMapping[builderType] || "bg-gray-50 text-gray-700 ring-gray-200",
        `inline-flex items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
      )}
    >
      {model && model !== "" ? model : "Unsupported"}
    </span>
  );
};

export default ModelPill;
