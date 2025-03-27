import { forwardRef } from "react";
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
        "bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && icon}
      <div
        className={clsx(
          "text-sm font-medium items-center text-gray-900 dark:text-gray-100 hidden sm:flex gap-1",
          textClassName
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
  )
);

GenericButton.displayName = "GenericButton";

export default GenericButton;
