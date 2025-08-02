/**
 * A visualization component that displays different visualization styles based on evaluator type
 */
export const MockVisualization = ({ type }: { type: string }) => {
  // Different visualization styles based on evaluator type
  if (type === "LLM as a judge") {
    return (
      <div className="flex h-8 w-full items-end gap-[2px]">
        {[0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 0.4, 0.8, 0.9, 1.0].map((height, i) => (
          <div
            key={i}
            className="w-full rounded-sm bg-blue-400"
            style={{ height: `${height * 32}px` }}
          />
        ))}
      </div>
    );
  } else if (type === "Python") {
    return (
      <div className="flex h-8 w-full items-center">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-blue-500" style={{ width: "70%" }}></div>
        </div>
      </div>
    );
  } else {
    // Default visualization
    return (
      <div className="flex h-8 w-full items-end gap-[2px]">
        {[0.4, 0.6, 0.5, 0.8, 0.7, 0.4, 0.6, 0.7, 0.9, 0.5].map((height, i) => (
          <div
            key={i}
            className="w-full rounded-sm bg-blue-400"
            style={{ height: `${height * 32}px` }}
          />
        ))}
      </div>
    );
  }
};
