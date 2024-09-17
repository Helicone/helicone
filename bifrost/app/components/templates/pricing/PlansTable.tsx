import { Col } from "@/components/common/col";
import { Card } from "@/components/ui/card";
import { clsx } from "@/utils/clsx";

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
        "p-[24px] gap-[12px]",
        title === "SOC-2 Type II Compliance" ||
          title === "Alerts (Slack + Email)"
          ? "rounded-bl-lg"
          : ""
      )}
    >
      <Col className="gap-[4px]">
        <h3 className="text-lg font-semibold gap-[12px] items-center">
          {title}
        </h3>
        {title === "Requests" ? ( // doing this check to avoid hydration errors (div inside p)
          description
        ) : (
          <p className="text-slate-500">{description}</p>
        )}
      </Col>
    </Col>
    <div className="p-[24px] max-w-[360px] items-center justify-center flex flex-col gap-[4px]">
      {free}
    </div>
    <div className="p-[24px] max-w-[360px] items-center justify-center flex flex-col gap-[4px] bg-[rgba(12,165,234,0.05)]">
      {pro}
    </div>
    <div className="p-[24px] max-w-[360px] items-center justify-center flex flex-col gap-[4px]">
      {enterprise}
    </div>
  </>
);

export default function PlansTable({
  rows,
  isMain = false,
}: {
  rows: FeatureRowProps[];
  isMain?: boolean;
}) {
  return (
    <div className="w-full pt-10 overflow-x-auto">
      <div className="w-full overflow-visible">
        <div className="min-w-[800px] overflow-visible">
          <div className="grid grid-cols-[2fr,1fr,1fr,1fr] divide-x divide-y divide-slate-200 border-b border-r rounded-lg overflow-visible text-slate-900 border-slate-200">
            <div className="border-l border-t rounded-tl-lg bg-slate-50 border-slate-200"></div>
            <div className="p-[24px] bg-slate-50 font-semibold text-xl text-center">
              Free
            </div>
            <div className="relative p-[24px] bg-brand text-white font-semibold text-xl text-center overflow-visible border-brand">
              Pro
              {isMain && (
                <Card className="absolute top-0 right-1/2 bg-[#F3FAFE] translate-x-1/2 -translate-y-[24px] rotate-[10.2deg] px-[12px] py-[6px] border-brand border-[2px] rounded-[4px] overflow-visible">
                  <h3 className="text-[16px] font-semibold text-brand">
                    Recommended
                  </h3>
                </Card>
              )}
            </div>
            <div className="p-[24px] bg-slate-50 font-semibold text-xl text-center rounded-tr-lg">
              Enterprise
            </div>
            {rows.map((row) => (
              <FeatureRow key={row.title} {...row} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
