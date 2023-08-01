import { clsx } from "../../shared/clsx";
import { getBuilderType } from "./builder/requestBuilder";

interface ModelPillProps {
  model: string;
}

const ModelPill = (props: ModelPillProps) => {
  const { model } = props;

  const builderType = getBuilderType(model);

  let modelMapping = {
    FunctionGPTBuilder: "purple",
    GPT3Builder: "green",
    ModerationBuilder: "teal",
    EmbeddingBuilder: "blue",
    ClaudeBuilder: "orange",
  };

  const color = modelMapping[builderType] || "gray";

  return (
    <span
      className={clsx(
        `bg-${color}-50 text-${color}-700 ring-${color}-200`,
        `inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset`
      )}
    >
      {model && model !== "" ? model : "Unknown"}
    </span>
  );
};

export default ModelPill;
