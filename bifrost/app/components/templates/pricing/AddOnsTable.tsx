import { Col } from "@/components/common/col";
import PlansTable, { FeatureRowProps } from "./PlansTable";
import { Row } from "@/components/common/row";
import { XMarkIcon } from "@heroicons/react/24/outline";

const rows: FeatureRowProps[] = [
  {
    title: "Prompts + Experiments",
    description: "Visualize your LLM analytics, and watch your AI app improve.",
    free: (
      <>
        <XMarkIcon className="w-6 h-6 text-red-500" />
        <p className="text-center text-sm font-light text-slate-500">
          Upgrade to Pro to enable Prompts + Experiments.
        </p>
      </>
    ),
    pro: (
      <>
        <Row className="items-center gap-[4px]">
          <h3 className="font-bold text-xl">$30</h3>
          <p className="text-slate-500">/mo</p>
        </Row>
        <p className="text-center text-sm font-light text-slate-500">
          Unlimited prompts and versions.
        </p>
      </>
    ),
    enterprise: (
      <>
        <h3 className="font-bold text-xl">Included</h3>
        <p className="text-center text-sm font-light text-slate-500">
          Unlimited prompts and versions.
        </p>
      </>
    ),
  },
  {
    title: "Alerts (Slack + Email)",
    description: <>Include 10,000 free requests every month!</>,
    free: (
      <>
        <XMarkIcon className="w-6 h-6 text-red-500" />
        <p className="text-center text-sm font-light text-slate-500">
          Upgrade to Pro to enable Alerts.
        </p>
      </>
    ),
    pro: (
      <>
        <Row className="items-center gap-[4px]">
          <h3 className="font-bold text-xl">$15</h3>
          <p className="text-slate-500">/mo</p>
        </Row>
        <p className="text-center text-sm font-light text-slate-500">
          Unlimited alerts.
        </p>
      </>
    ),
    enterprise: (
      <>
        <h3 className="font-bold text-xl">Included</h3>
        <p className="text-center text-sm font-light text-slate-500">
          Unlimited alerts.
        </p>
      </>
    ),
  },
];

export default function AddOnsTable() {
  return (
    <div className="flex flex-col max-w-6xl mx-auto pt-8 w-full">
      <Col>
        <h4 className="text-[24px] font-bold text-slate-900">Add-ons</h4>
        <p className="text-slate-700">
          Specialized features are now available as add-ons, so you never pay
          what you don’t need.
        </p>
      </Col>
      <PlansTable rows={rows} />
    </div>
  );
}
