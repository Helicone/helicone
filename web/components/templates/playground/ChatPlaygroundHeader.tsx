import React from "react";

const ChatPlaygroundHeader: React.FC<{
  mode: "pretty" | "json";
  setMode: (_mode: "pretty" | "json") => void;
}> = ({ mode, setMode }) => {
  return (
    <ul className="relative h-fit w-full rounded-lg">
      <li className="flex items-center justify-end">
        <div>
          <button
            className="rounded-lg bg-white px-3 py-2 text-xs text-gray-500 shadow-sm dark:text-gray-400"
            onClick={() => setMode(mode === "pretty" ? "json" : "pretty")}
          >
            {mode === "pretty" ? "JSON" : "Pretty"}
          </button>
        </div>
      </li>
    </ul>
  );
};

export default ChatPlaygroundHeader;
