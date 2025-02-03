import { Col } from "@/components/common/col";
import PlansTable, { FeatureRowProps } from "./PlansTable";
import { Row } from "@/components/common/row";
import { XMarkIcon } from "@heroicons/react/24/outline";

const rows: FeatureRowProps[] = [
  {
    title: "Prompts Management",
    description:
      "Version prompts, create templates, and manage prompts collaboratively.",
    free: (
      <>
        <XMarkIcon className="w-6 h-6 text-red-500" />
        <p className="text-center text-sm font-light text-slate-500">
          Upgrade to Pro to enable Prompts.
        </p>
      </>
    ),
    pro: (
      <>
        <Row className="items-center gap-[4px]">
          <h3 className="font-bold text-xl">$50</h3>
          <p className="text-slate-500">/mo</p>
        </Row>
        <p className="text-center text-sm font-light text-slate-500">
          Prompt management
        </p>
      </>
    ),
    enterprise: (
      <>
        <h3 className="font-bold text-xl">Included</h3>
        <p className="text-center text-sm font-light text-slate-500">
          Prompt management
        </p>
      </>
    ),
  },
  {
    title: "Experiments",
    description:
      "Test different prompts, models, and parameters side-by-side to improve LLM outputs.",
    free: (
      <>
        <XMarkIcon className="w-6 h-6 text-red-500" />
        <p className="text-center text-sm font-light text-slate-500">
          Upgrade to Pro to enable Experiments.
        </p>
      </>
    ),
    pro: (
      <>
        <Row className="items-center gap-[4px]">
          <h3 className="font-bold text-xl">$50</h3>
          <p className="text-slate-500">/mo</p>
        </Row>
        <p className="text-center text-sm font-light text-slate-500">
          Full experimentation suite
        </p>
      </>
    ),
    enterprise: (
      <>
        <h3 className="font-bold text-xl">Included</h3>
        <p className="text-center text-sm font-light text-slate-500">
          Advanced experimentation
        </p>
      </>
    ),
  },
  {
    title: "Evaluations",
    description:
      "Evaluate LLM outputs with automated testing and catch regressions pre-deployment.",
    free: (
      <>
        <XMarkIcon className="w-6 h-6 text-red-500" />
        <p className="text-center text-sm font-light text-slate-500">
          Upgrade to Pro to enable Evaluations.
        </p>
      </>
    ),
    pro: (
      <>
        <Row className="items-center gap-[4px]">
          <h3 className="font-bold text-xl">$100</h3>
          <p className="text-slate-500">/mo</p>
        </Row>
        <p className="text-center text-sm font-light text-slate-500">
          Complete evaluation suite
        </p>
      </>
    ),
    enterprise: (
      <>
        <h3 className="font-bold text-xl">Included</h3>
        <p className="text-center text-sm font-light text-slate-500">
          Advanced evaluations
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
          for what you don&apos;t need.
        </p>
      </Col>
      <PlansTable rows={rows} />
    </div>
  );
}
