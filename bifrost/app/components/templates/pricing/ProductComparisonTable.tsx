import { clsx } from "@/utils/clsx";
import {
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import { useRef } from "react";

const products = [
  { name: "langsmith", logo: "/static/other-logos/langsmith.png" },
  { name: "braintrust", logo: "/static/other-logos/braintrust.webp" },
  { name: "arize ai", logo: "/static/other-logos/arize.png" },
  { name: "langfuse", logo: "/static/other-logos/langfuse.png" },
  { name: "helicone", logo: "/static/other-logos/helicone.png" },
];

const featureMatrix = [
  { name: "Built for scale", support: ["No", "No", "No", "No", "Yes"] },
  { name: "1 line integration", support: ["No", "No", "No", "No", "Yes"] },
  { name: "Flexible pricing", support: ["No", "No", "No", "Yes", "Yes"] },
  { name: "Open-source", support: ["No", "No", "Yes", "Yes", "Yes"] },
  { name: "Prompts", support: ["Yes", "Yes", "Yes", "Yes", "Yes"] },
  {
    name: "Experiments",
    support: ["No", "Yes", "No", "No", "Yes"],
  },
  { name: "Evaluation", support: ["Limited", "Yes", "Yes", "Yes", "Yes"] },
  { name: "Tracing", support: ["Yes", "Limited", "Yes", "Yes", "Yes"] },
  { name: "User tracking", support: ["Yes", "No", "No", "Limited", "Yes"] },
  {
    name: "Gateway Features",
    support: ["No", "Limited", "No", "No", "Yes"],
  },
  {
    name: "UI",
    support: ["Confusing", "Confusing", "Average", "Average", "Intuitive"],
  },
];

export default function ProductComparisonTable() {
  const tableRef = useRef<HTMLTableElement>(null);

  const renderSupportCell = (value: string) => {
    switch (value.toLowerCase()) {
      case "yes":
        return <CheckIcon className="mx-auto h-6 w-6 text-green-500" />;
      case "no":
        return <XMarkIcon className="mx-auto h-6 w-6 text-red-500" />;
      case "limited":
        return (
          <div className="flex flex-col items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
            <span className="mt-1 text-xs font-medium text-amber-700">
              Limited
            </span>
          </div>
        );
      default:
        return (
          <span className="text-sm font-medium text-slate-700">{value}</span>
        );
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col space-y-8">
      <h3 className="text-[36px] font-bold text-slate-900">
        Compare to similar products
      </h3>

      <div className="relative overflow-x-auto rounded-lg">
        <table
          ref={tableRef}
          className="w-full border-separate border-spacing-0 rounded-lg border border-slate-200 bg-slate-50"
        >
          <thead className="rounded-t-lg">
            <tr>
              <th className="rounded-tl-lg border-r border-slate-200 bg-slate-50 p-2 text-left font-semibold"></th>
              {products.map((product) => (
                <th
                  key={product.name}
                  className="last:border-brand border-slate-200 p-2 text-center font-semibold text-slate-900 last:rounded-tr-lg last:border-2 last:border-b-0 last:bg-white"
                >
                  <img
                    src={product.logo}
                    alt={product.logo}
                    className="mx-auto mb-2 mt-2 h-6"
                  />
                  {product.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {featureMatrix.map((feature, index) => (
              <tr
                key={feature.name}
                className={clsx(
                  "h-[56px]",
                  index % 2 === 1 ? "bg-slate-50" : "bg-white"
                )}
              >
                <td
                  className={clsx(
                    "px-4 py-0 font-semibold",
                    "border-r border-slate-200 text-slate-900",
                    index % 2 === 1 ? "bg-slate-50" : "bg-white",
                    index === featureMatrix.length - 1
                      ? "rounded-bl-lg"
                      : "rounded-b-none"
                  )}
                >
                  {feature.name}
                </td>
                {feature.support.map((supported, i) => (
                  <td
                    key={`${feature.name}-${products[i].name}`}
                    className={clsx(
                      "last:border-brand p-2 text-center last:border-l-2 last:border-r-2 last:bg-white",
                      index === featureMatrix.length - 1
                        ? "last:rounded-br-lg last:border-b-2"
                        : "last:border-b-0"
                    )}
                  >
                    {renderSupportCell(supported)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
