import { getBuilderType } from "./builder/requestBuilder";

interface ModelPillProps {
  model: string;
}

const ModelPill = (props: ModelPillProps) => {
  const { model } = props;

  const builderType = getBuilderType(model);

  let modelMapping = {
    FunctionGPTBuilder: "purple",
    GPT3Builder: "orange",
    ModerationBuilder: "teal",
    EmbeddingBuilder: "blue",
  };

  const color = modelMapping[builderType] || "gray";

  return (
    <span
      className={`inline-flex items-center rounded-full bg-${color}-50 px-2 py-1 text-xs font-medium text-${color}-700 ring-1 ring-inset ring-${color}-600/20`}
    >
      {model && model !== "" ? model : "Unknown"}
    </span>
  );

  // switch (model) {
  //   case "text-davinci-003":
  //     return (
  //       <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
  //         {model}
  //       </span>
  //     );
  //   case "gpt-3.5-turbo":
  //     return (
  //       <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
  //         {model}
  //       </span>
  //     );
  //   case "gpt-4":
  //     return (
  //       <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">
  //         {model}
  //       </span>
  //     );
  //   case "gpt-3.5-turbo-0613":
  //     return (
  //       <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20">
  //         {model}
  //       </span>
  //     );
  //   case "gpt-4-0613":
  //     return (
  //       <span className="inline-flex items-center rounded-full bg-fuchsia-50 px-2 py-1 text-xs font-medium text-fuchsia-700 ring-1 ring-inset ring-fuchsia-600/20">
  //         {model}
  //       </span>
  //     );
  //   default:
  //     return (
  //       <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
  //         {model && model !== "" ? model : "Unknown"}
  //       </span>
  //     );
  // }
};

export default ModelPill;
