import { clsx } from "@/utils/clsx";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { useEffect, useRef } from "react";

const products = [
  { name: "langsmith", logo: "/static/other-logos/langsmith.png" },
  { name: "arize ai", logo: "/static/other-logos/arize.png" },
  { name: "honeyhive", logo: "/static/other-logos/honeyhive.png" },
  { name: "langfuse", logo: "/static/other-logos/langfuse.png" },
  { name: "helicone", logo: "/static/other-logos/helicone.png" },
];

const featureMatrix = [
  { name: "Built for scale", support: [false, false, false, false, true] },
  { name: "1 line integration", support: [false, false, false, false, true] },
  { name: "Flexible pricing", support: [false, false, false, true, true] },
  { name: "Open-source", support: [false, true, false, true, true] },
  { name: "Prompts", support: [true, true, true, true, true] },
  { name: "Evaluation", support: [true, true, false, false, true] },
  { name: "Tracing", support: [true, true, true, true, true] },
  { name: "Use tracking", support: [true, false, true, true, true] },
  { name: "Exports", support: [true, true, true, true, true] },
];

export default function ProductComparisonTable() {
  const tableRef = useRef<HTMLTableElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8 py-16 w-full">
      <h3 className="text-[36px] font-bold text-slate-900">
        Compare to similar products
      </h3>

      <div className="overflow-x-auto relative rounded-lg">
        <table
          ref={tableRef}
          className="w-full border-separate border-spacing-0 bg-slate-50 rounded-lg border border-slate-200"
        >
          <thead className="rounded-t-lg">
            <tr>
              <th className="p-2 text-left font-semibold bg-slate-50 border-r border-slate-200 rounded-tl-lg"></th>
              {products.map((product) => (
                <th
                  key={product.name}
                  className="p-2 text-center text-slate-900 font-semibold last:bg-white last:rounded-tr-lg last:border-b-0 last:border-brand last:border-2 border-slate-200"
                >
                  <img
                    src={product.logo}
                    alt={product.logo}
                    className="h-6 mx-auto mb-2 mt-2" // Added more padding above and below the image
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
                  "h-[48px]",
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
                      "p-2 text-center last:bg-white last:border-r-2 last:border-l-2 last:border-brand",
                      index === featureMatrix.length - 1
                        ? "last:border-b-2 last:rounded-br-lg"
                        : "last:border-b-0"
                    )}
                  >
                    {supported ? (
                      <CheckIcon className="w-6 h-6 text-green-500 mx-auto" />
                    ) : (
                      <XMarkIcon className="w-6 h-6 text-red-500 mx-auto" />
                    )}
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
