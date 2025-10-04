import React, { forwardRef } from "react";
import clsx from "clsx";

interface GenericButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  icon?: React.ReactNode;
  text: string;
  count?: number;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
}

export const GenericButton = forwardRef<HTMLButtonElement, GenericButtonProps>(
  ({ onClick, icon, text, count, disabled, className, textClassName }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "flex flex-row items-center gap-2 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 hover:bg-sky-50 dark:border-gray-700 dark:bg-black dark:hover:bg-sky-900",
        className,
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && icon}
      <div
        className={clsx(
          "hidden items-center gap-1 text-sm font-medium text-gray-900 dark:text-gray-100 sm:flex",
          textClassName,
        )}
      >
        {text}
      </div>
      {count !== undefined && (
        <code className="text-xs text-gray-500 dark:text-gray-400">
          ({count})
        </code>
      )}
    </button>
  ),
);

GenericButton.displayName = "GenericButton";

export default GenericButton;
