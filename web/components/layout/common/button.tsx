import React from "react";

interface GenericButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  text: string;
  count?: number;
}

export const GenericButton: React.FC<GenericButtonProps> = ({
  onClick,
  icon,
  text,
  count,
}) => (
  <button
    className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
    onClick={onClick}
  >
    {icon && icon}
    <div className="text-sm font-medium items-center text-gray-900 dark:text-gray-100 hidden sm:flex gap-1">
      {text}
    </div>
    {count !== undefined && (
      <code className="text-xs text-gray-500 dark:text-gray-400">
        ({count})
      </code>
    )}
  </button>
);

export default GenericButton;
