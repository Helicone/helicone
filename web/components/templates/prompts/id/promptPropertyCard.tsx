import { clsx } from "../../../shared/clsx";
import { getUSDateFromString } from "../../../shared/utils/utils";

interface PromptPropertyCardProps {
  isSelected: boolean;
  onSelect: () => void;
  requestId: string;
  createdAt: string;
  properties: Record<string, string>;
  index?: number;
  size?: "small" | "large";
}

const PromptPropertyCard = (props: PromptPropertyCardProps) => {
  const {
    isSelected,
    onSelect,
    requestId,
    createdAt,
    properties,
    index,
    size = "large",
  } = props;

  return (
    <div
      className={clsx(
        isSelected
          ? "bg-sky-100 border-sky-500 dark:bg-sky-950"
          : "bg-white border-gray-300 dark:bg-black dark:border-gray-700",
        "w-full border p-4 rounded-lg"
      )}
    >
      <button className={clsx("flex flex-col w-full")} onClick={onSelect}>
        <div className="flex flex-col items-start w-full">
          <div className="flex items-center w-full justify-between">
            <p
              className={clsx(
                size === "large" ? "text-lg" : "text-sm",
                "font-semibold text-black dark:text-white"
              )}
            >
              {requestId}
            </p>
            <div className="border rounded-full border-gray-500 bg-white dark:bg-black h-6 w-6 flex items-center justify-center">
              {isSelected && index === undefined && (
                <div className="bg-sky-500 rounded-full h-4 w-4" />
              )}
              {index && (
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  {index}
                </p>
              )}
            </div>
          </div>
          <p
            className={clsx(
              size === "large" ? "text-sm" : "text-xs",
              "text-gray-500"
            )}
          >
            {getUSDateFromString(createdAt)}
          </p>
        </div>
      </button>
      <ul className="divide-y divide-gray-300 dark:divide-gray-700 flex flex-col mt-4 w-full">
        {Object.entries(properties).map(([key, value]) => (
          <li
            key={key}
            className="flex items-center py-2 justify-between gap-8"
          >
            <p
              className={clsx(
                size === "large" ? "text-sm" : "text-xs",
                "font-semibold text-black dark:text-white"
              )}
            >
              {key}
            </p>
            <p
              className={clsx(
                size === "large" ? "text-sm" : "text-xs",
                "text-sm text-gray-700 dark:text-gray-300 max-w-[22.5vw] truncate"
              )}
            >
              {value}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PromptPropertyCard;
