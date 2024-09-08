import { clsx } from "@/utils/clsx";
import { CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";

const products = [
  { name: "langsmith", logo: "/path-to-langsmith-logo.png" },
  { name: "arize ai", logo: "/path-to-arize-ai-logo.png" },
  { name: "honeyhive", logo: "/path-to-honeyhive-logo.png" },
  { name: "langfuse", logo: "/path-to-langfuse-logo.png" },
  { name: "helicone", logo: "/path-to-helicone-logo.png" },
];

const featureMatrix = [
  { name: "Built for Scale", support: [false, false, false, false, true] },
  { name: "1 line integration", support: [false, false, false, false, true] },
  { name: "Flexible Pricing", support: [false, false, false, false, true] },
  { name: "Open-source", support: [false, false, false, true, true] },
  { name: "Prompts", support: [false, false, false, false, true] },
  { name: "Evaluation", support: [false, true, false, false, true] },
  { name: "Tracing", support: [false, false, false, false, true] },
  { name: "Use tracking", support: [false, false, false, false, true] },
  { name: "Exports", support: [false, false, false, false, true] },
];

export default function ProductComparisonTable() {
  return (
    <div className="py-10">
      <h2 className="text-3xl font-bold mb-6">Compare to similar products</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse rounded-lg bg-gray-100">
          <thead>
            <tr className="">
              <th className="p-3 text-left font-semibold"></th>
              {products.map((product) => (
                <th
                  key={product.name}
                  className="p-3 text-center font-semibold last:bg-white last:border-2 last:border-blue-200 last:border-b-0"
                >
                  <img
                    src={product.logo}
                    alt={product.name}
                    className="h-8 mx-auto mb-2"
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
                className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="p-3 font-semibold">{feature.name}</td>
                {feature.support.map((supported, i) => (
                  <td
                    key={`${feature.name}-${products[i].name}`}
                    className={clsx(
                      "p-3 text-center last:bg-white last:border-r-2 last:border-r-blue-200 last:border-l-2 last:border-l-blue-200",
                      index === featureMatrix.length - 1 &&
                        "last:border-b-2 last:border-b-blue-200 last:rounded-br-lg"
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
