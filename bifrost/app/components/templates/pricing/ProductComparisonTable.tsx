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

  useEffect(() => {
    const updateOverlayWidth = () => {
      if (tableRef.current && overlayRef.current) {
        const lastColumn = tableRef.current.querySelector(
          "tr:first-child th:last-child"
        );
        if (lastColumn) {
          overlayRef.current.style.width = `${lastColumn.clientWidth}px`;
        }
      }
    };

    updateOverlayWidth();
    window.addEventListener("resize", updateOverlayWidth);

    return () => window.removeEventListener("resize", updateOverlayWidth);
  }, []);

  return (
    <div className="flex flex-col max-w-6xl mx-auto space-y-8 py-16 w-full">
      <h3 className="text-[36px] font-bold">Compare to similar products</h3>

      <div className="overflow-x-auto relative border rounded-lg">
        <div
          ref={overlayRef}
          className="absolute top-0 right-0 h-full rounded-r-lg border-[#0CA5EA] border-2"
        ></div>
        <table ref={tableRef} className="w-full border-collapse bg-gray-100">
          <thead>
            <tr>
              <th className="p-2 text-left font-semibold bg-white"></th>
              {products.map((product) => (
                <th
                  key={product.name}
                  className="p-2 text-center font-semibold last:bg-white"
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
                  index % 2 === 0 ? "bg-gray-50" : "bg-white"
                )}
              >
                <td className={clsx("px-4 py-0 font-semibold", "bg-white border")}>
                  {feature.name}
                </td>
                {feature.support.map((supported, i) => (
                  <td
                    key={`${feature.name}-${products[i].name}`}
                    className={clsx("p-2 text-center last:bg-white")}
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
