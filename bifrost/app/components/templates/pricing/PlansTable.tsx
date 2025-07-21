import { Col } from "@/components/common/col";
import { Card } from "@/components/ui/card";
import { clsx } from "@/utils/clsx";
import { useState } from "react";

export interface FeatureRowProps {
  title: string;
  description: string | React.ReactNode;
  free: React.ReactNode;
  pro: React.ReactNode;
  enterprise: React.ReactNode;
}

const FeatureRow: React.FC<FeatureRowProps> = ({
  title,
  description,
  free,
  pro,
  enterprise,
}) => (
  <>
    <Col
      className={clsx(
        "gap-[12px] p-[24px]",
        title === "SOC-2 Type II Compliance" ||
          title === "Alerts (Slack + Email)"
          ? "rounded-bl-lg"
          : ""
      )}
    >
      <Col className="gap-[4px]">
        <h3 className="items-center gap-[12px] text-lg font-semibold">
          {title}
        </h3>
        {title === "Requests" || title === "API access" ? ( // doing this check to avoid hydration errors (div inside p)
          description
        ) : (
          <p className="text-slate-500">{description}</p>
        )}
      </Col>
    </Col>
    <div className="flex max-w-[360px] flex-col items-center justify-center gap-[4px] p-[24px]">
      {free}
    </div>
    <div className="flex max-w-[360px] flex-col items-center justify-center gap-[4px] bg-[rgba(12,165,234,0.05)] p-[24px]">
      {pro}
    </div>
    <div className="flex max-w-[360px] flex-col items-center justify-center gap-[4px] p-[24px]">
      {enterprise}
    </div>
  </>
);

export default function PlansTable({
  rows,
  isMain = false,
  collapsible = false,
  initialVisibleCount = 5,
}: {
  rows: FeatureRowProps[];
  isMain?: boolean;
  collapsible?: boolean;
  initialVisibleCount?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleRows =
    collapsible && !showAll ? rows.slice(0, initialVisibleCount) : rows;

  return (
    <div className="w-full overflow-x-auto pt-10">
      <div className="w-full overflow-visible">
        <div className="min-w-[800px] overflow-visible">
          <div className="grid grid-cols-[2fr,1fr,1fr,1fr] divide-x divide-y divide-slate-200 overflow-visible rounded-lg border-b border-r border-slate-200 text-slate-900">
            <div className="rounded-tl-lg border-l border-t border-slate-200 bg-slate-50"></div>
            <div className="bg-slate-50 p-[24px] text-center text-xl font-semibold">
              Free
            </div>
            <div className="bg-brand border-brand relative overflow-visible p-[24px] text-center text-xl font-semibold text-white">
              Pro
              {isMain && (
                <Card className="border-brand absolute right-1/2 top-0 -translate-y-[24px] translate-x-1/2 rotate-[10.2deg] overflow-visible rounded-[4px] border-[2px] bg-[#F3FAFE] px-[12px] py-[6px]">
                  <h3 className="text-brand text-[16px] font-semibold">
                    Recommended
                  </h3>
                </Card>
              )}
            </div>
            <div className="rounded-tr-lg bg-slate-50 p-[24px] text-center text-xl font-semibold">
              Enterprise
            </div>
            {visibleRows.map((row) => (
              <FeatureRow key={row.title} {...row} />
            ))}
          </div>
          {collapsible && !showAll && (
            <>
              <div className="relative">
                <div className="pointer-events-none absolute bottom-[100%] left-0 right-0 h-[100px] bg-gradient-to-b from-transparent to-white" />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowAll(true)}
                  className="text-brand hover:text-brand/80 font-medium"
                >
                  See all features
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
