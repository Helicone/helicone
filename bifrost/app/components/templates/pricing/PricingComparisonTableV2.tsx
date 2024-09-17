import { Row } from "@/components/common/row";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import PlansTable, { FeatureRowProps } from "./PlansTable";

const rows: FeatureRowProps[] = [
  {
    title: "Dashboard",
    description: "Visualize your LLM analytics, and watch your AI app improve.",
    free: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    pro: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    enterprise: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
  },
  {
    title: "Requests",
    description: (
      <>
        <p className="text-slate-500">
          Include 10,000 free requests every month!
        </p>
        <Row className="items-center gap-[4px] text-brand">
          <div>How we calculate this</div>
          <ChevronDownIcon className="w-5 h-5" />
        </Row>
      </>
    ),
    free: (
      <>
        <Row className="items-center gap-[4px]">
          <h3 className="font-bold text-xl">10k</h3>
          <p className="text-slate-500 text-md">/mo</p>
        </Row>
        <p className="text-center text-sm font-light text-slate-500">
          For more requests, upgrade to Pro.
        </p>
      </>
    ),
    pro: (
      <>
        <Row className="items-center gap-[4px]">
          <h3 className="font-bold text-xl">100k</h3>
          <p className="text-slate-500">/mo</p>
        </Row>
        <p className="text-center text-sm font-light text-slate-500">
          Starting at $0.32/1k requests after.
        </p>
      </>
    ),
    enterprise: (
      <>
        <h3 className="font-bold text-xl">Unlimited</h3>
        <p className="text-center text-sm font-light  text-slate-500">
          At bulk discounted rate.
        </p>
      </>
    ),
  },
  {
    title: "Log retention",
    description: "Visualize your LLM analytics, and watch your AI app improve.",
    free: <h3 className="font-bold text-xl">1 month</h3>,
    pro: <h3 className="font-bold text-xl">3 months</h3>,
    enterprise: <h3 className="font-bold text-xl">Forever</h3>,
  },
  {
    title: "Playground",
    description: "Visualize your LLM analytics, and watch your AI app improve.",
    free: <XMarkIcon className="w-6 h-6 text-red-500" />,
    pro: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    enterprise: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
  },
  {
    title: "Cache",
    description: "Visualize your LLM analytics, and watch your AI app improve.",
    free: <XMarkIcon className="w-6 h-6 text-red-500" />,
    pro: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    enterprise: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
  },
  {
    title: "Rate limits",
    description: "Visualize your LLM analytics, and watch your AI app improve.",
    free: <XMarkIcon className="w-6 h-6 text-red-500" />,
    pro: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    enterprise: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
  },
  {
    title: "Sessions",
    description: "Visualize your LLM analytics, and watch your AI app improve.",
    free: <XMarkIcon className="w-6 h-6 text-red-500" />,
    pro: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    enterprise: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
  },
  {
    title: "User tracking",
    description: "Visualize your LLM analytics, and watch your AI app improve.",
    free: <XMarkIcon className="w-6 h-6 text-red-500" />,
    pro: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    enterprise: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
  },
  {
    title: "Datasets",
    description: "Visualize your LLM analytics, and watch your AI app improve.",
    free: <XMarkIcon className="w-6 h-6 text-red-500" />,
    pro: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    enterprise: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
  },
  {
    title: "API access",
    description: "Visualize your LLM analytics, and watch your AI app improve.",
    free: <XMarkIcon className="w-6 h-6 text-red-500" />,
    pro: (
      <Row className="items-center gap-[4px]">
        <h3 className="font-bold text-xl">60 calls</h3>
        <p className="text-slate-500">/min</p>
      </Row>
    ),
    enterprise: (
      <Row className="items-center gap-[4px]">
        <h3 className="font-bold text-xl">1k calls</h3>
        <p className="text-slate-500">/min</p>
      </Row>
    ),
  },
  {
    title: "SOC-2 Type II Compliance",
    description: "Visualize your LLM analytics, and watch your AI app improve.",
    free: <XMarkIcon className="w-6 h-6 text-red-500" />,
    pro: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    enterprise: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
  },
];

export default function PricingComparisonTableV2() {
  return (
    <div
      className="flex flex-col max-w-6xl mx-auto pt-16 pb-2 w-full"
      id="compare-plans"
    >
      <h3 className="text-[36px] font-bold text-slate-900">Compare plans</h3>
      <PlansTable rows={rows} isMain />
    </div>
  );
}
