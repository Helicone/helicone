import { DecryptedProviderKeyMapping } from "../../../services/lib/keys";
import { useLimitsCell } from "./useLimitsCell";

function getTimeWindowString(seconds: number) {
  if (seconds < 60) {
    return `${seconds} seconds`;
  } else if (seconds < 60 * 60) {
    return `${(seconds / 60).toFixed(2)} minutes`;
  } else if (seconds < 60 * 60 * 24) {
    return `${(seconds / 60 / 60).toFixed(2)} hours`;
  } else {
    return `${(seconds / 60 / 60 / 24).toFixed(2)} days`;
  }
}

function LimitRow({
  spend: spend,
  count,
  limit,
}: {
  spend: number;
  count: number;
  limit?: DecryptedProviderKeyMapping["limits"][number];
}) {
  if (!limit) return null;

  if (limit.cost !== null) {
    return (
      <div className="flex flex-row">
        <span className="mr-2">
          ${spend.toFixed(2)} / ${limit.cost} spent
        </span>
        <span className="mr-2">
          @ {getTimeWindowString(limit.timewindow_seconds!)}
        </span>
      </div>
    );
  } else {
    return (
      <div className="flex flex-row">
        <span className="mr-2">
          {count} / {limit.count} requests
        </span>
        <span className="mr-2">
          @ {getTimeWindowString(limit.timewindow_seconds!)}
        </span>
      </div>
    );
  }
}

export function LimitCell({
  limits,
}: {
  limits?: DecryptedProviderKeyMapping["limits"];
}) {
  const limitsUsage = useLimitsCell(limits);
  return (
    <div className="flex flex-col">
      {limitsUsage?.proxyKeysUsage?.map((usage, idx) => (
        <LimitRow
          key={idx}
          spend={usage.cost}
          count={usage.count}
          limit={limits?.[idx]}
        />
      ))}
    </div>
  );
}
