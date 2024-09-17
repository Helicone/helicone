import { Col } from "@/components/common/col";
import { Row } from "@/components/common/row";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clsx } from "@/utils/clsx";
import {
  CheckIcon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/outline";

interface FeatureRowProps {
  title: string;
  description: string;
  isAvailable: boolean;
  fullAccess?: boolean;
  amount?: string;
  unit?: string;
  additionalInfo?: string;
}

const FeatureRow: React.FC<FeatureRowProps> = ({
  title,
  description,
  isAvailable,
  fullAccess = false,
  amount,
  unit,
  additionalInfo,
}) => (
  <>
    <Col
      className={clsx("p-[24px] gap-[12px]", isAvailable ? "" : "bg-[#F9F9F9]")}
    >
      <Col className="gap-[4px]">
        <Row className="text-xl gap-[12px] items-center">
          <b>{title}</b>

          {fullAccess &&
            (isAvailable ? (
              <>
                <LockOpenIcon className="w-5 h-5" />
                <div
                  className={clsx(
                    "px-[12px] py-[4px] rounded-[3px] text-[14px] font-medium",
                    "bg-[#E7F6FD] text-brand"
                  )}
                >
                  full access
                </div>
              </>
            ) : (
              <>
                <LockClosedIcon className="w-5 h-5" />
                <div
                  className={clsx(
                    "px-[12px] py-[4px] rounded-[3px] text-[14px] font-medium",
                    "bg-[#F1F5F9] text-gray-600  "
                  )}
                >
                  available for <b>Team</b>
                </div>
              </>
            ))}
        </Row>
        <p className="text-slate-500">{description}</p>
      </Col>
      <Row className="items-center gap-[4px] text-brand">
        <div>How we calculate this</div>
        <ChevronDownIcon className="w-5 h-5" />
      </Row>
    </Col>
    <div
      className={clsx(
        "p-[24px] max-w-[360px] items-end text-end justify-center flex flex-col gap-[12px]",
        isAvailable ? "bg-white" : "bg-[#F9F9F9]"
      )}
    >
      {isAvailable ? (
        <CheckIcon className="w-6 h-6 text-[#6AA84F]" />
      ) : (
        <XMarkIcon className="w-6 h-6 text-red-500" />
      )}
      {amount && (
        <div className="flex flex-col gap-[4px] text-slate-500">
          <h3 className="text-[14px]">
            <b className="text-[18px] text-black font-bold">{amount}</b> {unit}
          </h3>
          {additionalInfo && (
            <p className="font-light">
              then starting at <br />
              {additionalInfo}
            </p>
          )}
        </div>
      )}
    </div>
  </>
);

export default function PricingComparisonTable() {
  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8 py-16 w-full">
      <h3 className="text-[36px] font-bold">Compare plans</h3>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px]">
          <Col className="rounded-lg border">
            <Row className="justify-between p-[24px] bg-[#F9F9F9] items-center">
              <h1 className="text-2xl font-bold">Developer plan</h1>
              <div className="text-2xl font-bold text-black">Free</div>
            </Row>
            <div className="grid grid-cols-[1fr,auto] divide-x divide-y border-t divide-slate-200">
              <FeatureRow
                title="Dashboard"
                description="Visualize your LLM analytics, and watch your AI app improve."
                isAvailable={true}
              />
              <FeatureRow
                title="Requests"
                description="First 10,000 requests free - every month!"
                isAvailable={true}
                amount="10k"
                unit="/mo"
                additionalInfo="$0.001 per request"
              />
              <FeatureRow
                title="Prompts"
                description="Requests individual requests logged within the Helicone platform. Blah blah blah this."
                isAvailable={false}
                fullAccess={true}
                amount="3"
                unit="/mo"
                additionalInfo="$0.001 per prompt"
              />
              <FeatureRow
                title="Exported requests"
                description="Requests individual requests logged within the Helicone platform. Blah blah blah this."
                isAvailable={false}
                fullAccess={true}
                amount="5k"
                unit="/mo"
                additionalInfo="$0.001 per requests"
              />
              <FeatureRow
                title="Evals"
                description="Requests individual requests logged within the Helicone platform. Blah blah blah this."
                isAvailable={false}
                fullAccess={true}
                amount="1k"
                unit="/mo"
                additionalInfo="$0.001 per requests"
              />
              <FeatureRow
                title="Datasets"
                description="Requests individual requests logged within the Helicone platform. Blah blah blah this."
                isAvailable={false}
                fullAccess={true}
                amount="1k"
                unit="/mo"
                additionalInfo="$0.001 per requests"
              />
            </div>
          </Col>
        </div>
      </div>
      <div className="w-full overflow-x-auto bg-white">
        <div className="min-w-[800px]">
          <Col className="rounded-lg border">
            <Row className="justify-between p-[24px] bg-[#F9F9F9] items-center">
              <h1 className="text-2xl font-bold">Team plan</h1>
              <Row className="items-center gap-[8px]">
                <Row className="text-[18px] text-black font-semibold line-through">
                  "$50/mo"
                </Row>
                <Row className="text-[36px] font-extrabold items-center">
                  <Row>
                    <span
                      className="text-[24px] pt-[4px]"
                      style={{ color: "black" }}
                    >
                      $
                    </span>
                    <span style={{ color: "black" }}>{"50"}</span>
                  </Row>
                  <span className="text-[18px]" style={{ color: "black" }}>
                    /mo
                  </span>
                </Row>
              </Row>
            </Row>
            <div className="grid grid-cols-[1fr,auto] divide-x divide-y border-t divide-slate-200">
              <FeatureRow
                title="Dashboard"
                description="Visualize your LLM analytics, and watch your AI app improve."
                isAvailable={true}
              />
              <FeatureRow
                title="Requests"
                description="First 10,000 requests free - every month!"
                isAvailable={true}
                amount="10k"
                unit="/mo"
                additionalInfo="$0.65 per 10k requests"
              />
              <FeatureRow
                title="Prompts"
                description="Requests individual requests logged within the Helicone platform. Blah blah blah this."
                isAvailable={true}
                fullAccess={true}
                amount="3"
                unit="/mo"
                additionalInfo="$0.001 per prompt"
              />
              <FeatureRow
                title="Exported requests"
                description="Requests individual requests logged within the Helicone platform. Blah blah blah this."
                isAvailable={true}
                fullAccess={true}
                amount="5k"
                unit="/mo"
                additionalInfo="$0.001 per requests"
              />
              <FeatureRow
                title="Evals"
                description="Requests individual requests logged within the Helicone platform. Blah blah blah this."
                isAvailable={true}
                fullAccess={true}
                amount="1k"
                unit="/mo"
                additionalInfo="$0.001 per requests"
              />
              <FeatureRow
                title="Datasets"
                description="Requests individual requests logged within the Helicone platform. Blah blah blah this."
                isAvailable={true}
                fullAccess={true}
                amount="1k"
                unit="/mo"
                additionalInfo="$0.001 per requests"
              />
            </div>
          </Col>
        </div>
      </div>
    </div>
  );
}
