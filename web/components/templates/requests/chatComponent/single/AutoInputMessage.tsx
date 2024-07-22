import React from "react";

interface AutoInputMessageProps {
  message: string;
}

export const AutoInputMessage: React.FC<AutoInputMessageProps> = ({
  message,
}) => {
  const indexMatch = message.match(/<helicone-auto-prompt-input idx=(\d+) \/>/);
  const index = indexMatch ? parseInt(indexMatch[1], 10) : 0;

  return (
    <div
      className={`border border-indigo-500 text-indigo-900 dark:text-indigo-300 font-semibold rounded-md bg-indigo-100 dark:bg-indigo-900  px-2 py-1 w-fit flex items-center`}
    >
      Auto Input Index: {index}
    </div>
  );
};
