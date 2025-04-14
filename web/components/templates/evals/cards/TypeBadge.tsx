import React from "react";

/**
 * A badge component that displays the evaluator type with appropriate styling
 */
export const TypeBadge = ({ type }: { type: string }) => {
  let color = "";

  switch (type) {
    case "LLM as a judge":
      color = "bg-blue-100 text-blue-800";
      break;
    case "Python":
      color = "bg-green-100 text-green-800";
      break;
    case "LastMile":
      color = "bg-purple-100 text-purple-800";
      break;
    default:
      color = "bg-slate-100 text-slate-800";
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color}`}
    >
      {type}
    </span>
  );
};
