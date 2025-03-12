import React from "react";

/**
 * A visualization component that displays different visualization styles based on evaluator type
 */
export const MockVisualization = ({ type }: { type: string }) => {
  // Different visualization styles based on evaluator type
  if (type === "LLM as a judge") {
    return (
      <div className="h-8 w-full flex items-end gap-[2px]">
        {[0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 0.4, 0.8, 0.9, 1.0].map((height, i) => (
          <div
            key={i}
            className="bg-blue-400 rounded-sm w-full"
            style={{ height: `${height * 32}px` }}
          />
        ))}
      </div>
    );
  } else if (type === "Python") {
    return (
      <div className="h-8 w-full flex items-center">
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500" style={{ width: "70%" }}></div>
        </div>
      </div>
    );
  } else {
    // Default visualization
    return (
      <div className="h-8 w-full flex items-end gap-[2px]">
        {[0.4, 0.6, 0.5, 0.8, 0.7, 0.4, 0.6, 0.7, 0.9, 0.5].map((height, i) => (
          <div
            key={i}
            className="bg-blue-400 rounded-sm w-full"
            style={{ height: `${height * 32}px` }}
          />
        ))}
      </div>
    );
  }
};
