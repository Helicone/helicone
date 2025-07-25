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
      className={`flex w-fit items-center rounded-md border border-indigo-500 bg-indigo-100 px-2 py-1 font-semibold text-indigo-900 dark:bg-indigo-900 dark:text-indigo-300`}
    >
      Message Index: {index}
    </div>
  );
};
