import { Row } from "@/components/common/row";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import PlansTable, { FeatureRowProps } from "./PlansTable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import RequestLogTableV2 from "./RequestLogTableV2";

const rows: FeatureRowProps[] = [
  {
    title: "Dashboard",
    description:
      "Visualize your LLM analytics, and watch your LLM app performance improve.",
    free: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    pro: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    enterprise: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
  },
  {
    title: "Requests",
    description: (
      <>
        <p className="text-slate-500">
          Includes 10,000 free requests every month!
        </p>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="text-brand justify-start gap-[4px] hover:no-underline p-0">
              How we calculate this
            </AccordionTrigger>
            <AccordionContent>
              <RequestLogTableV2 />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        {/* <Row className="items-center gap-[4px] text-brand">
          <div>How we calculate this</div>
          <ChevronDownIcon className="w-5 h-5" />
        </Row> */}
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
          <h3 className="font-bold text-xl">10k</h3>
          <p className="text-slate-500">/mo to unlimited</p>
        </Row>
        <p className="text-center text-sm font-light text-slate-500">
          From $0.35 down to $0.08 per 1k requests.
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
    description:
      "Access your logs and analytics so you can track performance over time. ",
    free: <h3 className="font-bold text-xl">1 month</h3>,
    pro: <h3 className="font-bold text-xl">3 months</h3>,
    enterprise: <h3 className="font-bold text-xl">Forever</h3>,
  },
  {
    title: "Playground",
    description:
      "Test and compare model responses with different prompts and parameters",
    free: <XMarkIcon className="w-6 h-6 text-red-500" />,
    pro: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    enterprise: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
  },
  {
    title: "Cache",
    description:
      "Reduce latency and save costs on LLM calls by caching responses on the edge. ",
    free: <XMarkIcon className="w-6 h-6 text-red-500" />,
    pro: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    enterprise: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
  },
  {
    title: "Evals",
    description:
      "Run LLM-as-a-Judge and Python evals to assess model and prompt performance.",
    free: <XMarkIcon className="w-6 h-6 text-red-500" />,
    pro: (
      <div className="text-center">
        <p className="text-slate-500">Pass-through cost</p>
        <p className="text-sm font-light text-slate-500">(no markup)</p>
      </div>
    ),
    enterprise: (
      <div className="text-center">
        <p className="text-slate-500">Pass-through cost</p>
        <p className="text-sm font-light text-slate-500">(no markup)</p>
      </div>
    ),
  },
  {
    title: "Rate limits",
    description: "Enforce custom API usage restrictions. ",
    free: <XMarkIcon className="w-6 h-6 text-red-500" />,
    pro: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    enterprise: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
  },
  {
    title: "Sessions",
    description: "Group and visualize multi-step LLM interactions. ",
    free: <XMarkIcon className="w-6 h-6 text-red-500" />,
    pro: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    enterprise: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
  },
  {
    title: "User tracking",
    description: "Track per-user request volumes, costs, and usage patterns. ",
    free: <XMarkIcon className="w-6 h-6 text-red-500" />,
    pro: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    enterprise: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
  },
  {
    title: "Datasets",
    description:
      "Organize your requests into datasets for model training or fine-tuning. ",
    free: <XMarkIcon className="w-6 h-6 text-red-500" />,
    pro: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
    enterprise: <CheckIcon className="w-6 h-6 text-[#6AA84F]" />,
  },
  {
    title: "API access",
    description: (
      <>
        <p className="text-slate-500">
          Use our{" "}
          <a
            href="https://docs.helicone.ai/rest/user/post-v1userquery"
            className="text-brand underline"
          >
            expansive API
          </a>
          .
        </p>
      </>
    ),
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
    description: "",
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
      <PlansTable rows={rows} isMain collapsible initialVisibleCount={5} />
    </div>
  );
}
