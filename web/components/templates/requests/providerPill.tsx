import { clsx } from "../../shared/clsx";
import { Provider } from "@helicone-package/llm-mapper/types";
import { colourPillStyles, getProviderColor } from "./colors";

interface ProviderPillProps {
  provider: Provider;
}

const ProviderPill = (props: ProviderPillProps) => {
  const { provider } = props;

  const colorKey = getProviderColor(provider);
  const colorClass = colourPillStyles[colorKey];

  const displayName =
    provider === "CUSTOM"
      ? "unknown"
      : provider
        ? provider.toLowerCase()
        : "unknown";
  return (
    <span
      className={clsx(
        colorClass,
        `-my-1 w-max items-center truncate rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset`,
      )}
    >
      {displayName}
    </span>
  );
};

export default ProviderPill;
