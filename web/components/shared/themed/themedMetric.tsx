import { clsx } from "../clsx";
import Spinner from "../static/Spinner/Spinner";

interface MetricProps {
  title: string;
  value: string;
  isLoading: boolean;
  icon: React.ReactNode;
  color: string;
  className?: string;
}

export default function Metric({
  title,
  value,
  isLoading,
  icon,
  color,
  className,
}: MetricProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center p-4 rounded-md ",
        className
      )}
      style={{ backgroundColor: color }}
    >
      {isLoading ? (
        <div className="h-24">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-row items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <div className="text-2xl font-semibold">{value}</div>
            <div className="text-sm">{title}</div>
          </div>
          <div className="ml-4">{icon}</div>
        </div>
      )}
    </div>
  );
}
