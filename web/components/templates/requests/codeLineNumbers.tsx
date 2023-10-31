import React from "react";

function LineNumberedPre(code: string) {
  const lines = JSON.stringify(code, null, 4).split("\n");
  return (
    <div className="rounded-lg overflow-auto relative">
      <pre className="text-xs whitespace-pre-wrap block ml-10">
        {JSON.stringify(code, null, 4)}
      </pre>
      <div
        className="absolute top-0 left-0 pt-1 pl-2 text-xs leading-5"
        style={{ userSelect: "none" }}
      >
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
    </div>
  );
}

export default LineNumberedPre;
