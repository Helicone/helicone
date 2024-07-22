import React from "react";

const ChatPlaygroundHeader: React.FC<{
  mode: "pretty" | "json";
  setMode: (mode: "pretty" | "json") => void;
}> = ({ mode, setMode }) => {
  return (
    <ul className="w-full rounded-lg relative h-fit">
      <li className="flex justify-end items-center">
        <div>
          <button
            className="text-gray-500 dark:text-gray-400 bg-white px-3 py-2 rounded-lg shadow-sm text-xs"
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
