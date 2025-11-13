import { clsx } from "../../shared/clsx";
import { colourPillStyles, ColorKey } from "../requests/colors";

interface AlertStatusPillProps {
  status: "resolved" | "triggered";
  displayText?: string;
}

const AlertStatusPill = (props: AlertStatusPillProps) => {
  const { status, displayText: customDisplayText } = props;

  const defaultDisplayMap = {
    resolved: "Resolved",
    triggered: "Triggered",
  };

  const displayText = customDisplayText || defaultDisplayMap[status];

  const getColorKey = (): ColorKey => {
    if (status === "triggered") {
      return "red";
    }
    return displayText === "Healthy" ? "emerald" : "gray";
  };

  const colorKey = getColorKey();
  const colorClass = colourPillStyles[colorKey];

  return (
    <span
      className={clsx(
        colorClass,
        "-my-1 w-max items-center truncate rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset"
      )}
    >
      {displayText}
    </span>
  );
};

export default AlertStatusPill;
