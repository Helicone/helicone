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
      className={`inline-flex items-center rounded-full bg-${color}-50 px-2 py-1 text-xs font-medium text-${color}-700 ring-1 ring-inset ring-${color}-600/20`}
    >
      {model && model !== "" ? model : "Unknown"}
    </span>
  );
};

export default ModelPill;
