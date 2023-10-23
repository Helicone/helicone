import {
  BellAlertIcon,
  CreditCardIcon,
  FolderArrowDownIcon,
  MagnifyingGlassCircleIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import Image from "next/image";

/* eslint-disable @next/next/no-img-element */
const metrics = [
  {
    id: 1,
    icon: CreditCardIcon,
    emphasis: "Stripe",
    rest: "integration to automatically bill users by token usage.",
  },
  {
    id: 2,
    icon: BellAlertIcon,
    emphasis: "Alerts",
    rest: "to stay on top of your costs and model downtime.",
  },
  {
    id: 3,
    icon: FolderArrowDownIcon,
    emphasis: "Export",
    rest: "your metrics into other tools like Looker, Mixpanel, and more.",
  },
  {
    id: 4,
    icon: MagnifyingGlassCircleIcon,
    emphasis: "Detect",
    rest: "toxicity, bias, and adversarial attacks to your model.",
  },
];

export default function AdvancedAnalytics() {
  const router = useRouter();
  return (
    <div className="relative bg-gray-900 py-8">
      <div className="absolute bottom-0 h-80 w-full xl:inset-0 xl:h-full">
        <div className="h-full w-full xl:grid xl:grid-cols-2">
          <div className="h-full xl:relative xl:col-start-2">
            <Image
              className="h-full w-full object-cover opacity-25 xl:absolute xl:inset-0"
              src="https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2830&q=80&sat=-100"
              alt="People working on laptops"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-gray-900 xl:inset-y-0 xl:left-0 xl:h-full xl:w-32 xl:bg-gradient-to-r"
            />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-6 lg:max-w-7xl lg:px-8 xl:grid xl:grid-flow-col-dense xl:grid-cols-2 xl:gap-x-8">
        <div className="relative pt-12 pb-64 sm:pt-24 sm:pb-64 xl:col-start-1 xl:pb-24">
          <h2 className="text-lg font-semibold text-sky-400">
            Advanced Analytics
          </h2>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            Helicone helps businesses use large language models in production.
          </p>
          <div className="mt-16 grid grid-cols-1 gap-y-12 gap-x-6 sm:grid-cols-2">
            {metrics.map((item) => (
              <p key={item.id} className="border border-white p-4 rounded-lg">
                <item.icon className="text-white h-8 w-8" />
                <span className="mt-1 block text-md text-gray-300">
                  <span className="font-medium text-white">
                    {item.emphasis}
                  </span>{" "}
                  {item.rest}
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
