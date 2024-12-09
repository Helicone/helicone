import { Card } from "@/components/ui/card";
import { ModelDetails } from "@/packages/cost/interfaces/Cost";
import Image from "next/image";
import RelatedComparisons from "./RelatedComparisons";

interface ModelCapabilitiesCardProps {
  modelA: string;
  providerA: string;
  modelB: string;
  providerB: string;
  modelDetailsA?: ModelDetails;
  modelDetailsB?: ModelDetails;
}

export default function ModelCapabilitiesCard({
  modelA,
  providerA,
  modelB,
  providerB,
  modelDetailsA,
  modelDetailsB,
}: ModelCapabilitiesCardProps) {
  const infoA = modelDetailsA?.info;
  const infoB = modelDetailsB?.info;

  return (
    <Card className="p-8">
      <div className="flex-col justify-start items-start gap-[60px]">
        {/* Capabilities Section */}
        <div className="self-stretch mb-8">
          <h2 className="text-black text-2xl font-bold font-['Inter'] mb-6">
            Reported Capabilities
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border border-slate-200">
              <h3 className="text-slate-900 text-lg font-semibold mb-4">
                {modelA}
              </h3>
              <ul className="space-y-2">
                {infoA?.capabilities.map((cap, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-sky-500 mr-2">•</span>
                    <span className="text-slate-700 text-sm">{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-lg p-6 border border-slate-200">
              <h3 className="text-slate-900 text-lg font-semibold mb-4">
                {modelB}
              </h3>
              <ul className="space-y-2">
                {infoB?.capabilities.map((cap, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-sky-500 mr-2">•</span>
                    <span className="text-slate-700 text-sm">{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Benchmarks Section */}
        <div className="self-stretch mb-8">
          <h2 className="text-black text-2xl font-bold font-['Inter'] mb-6">
            Benchmarks
          </h2>
          <div className="bg-slate-100">
            <table className="w-full bg-white rounded-xl">
              <thead>
                <tr className="bg-sky-50">
                  <th className="p-6 text-left text-slate-500 text-sm font-semibold border border-slate-200 rounded-tl-xl">
                    Model
                  </th>
                  {["MMLU", "BBH", "HellaSwag"].map((header, i, arr) => (
                    <th
                      key={header}
                      className={`p-6 text-left text-slate-500 text-sm font-semibold border border-slate-200 ${
                        i === arr.length - 1 ? "rounded-tr-xl" : ""
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[modelA, modelB].map((model, i, arr) => (
                  <tr key={model}>
                    <td
                      className={`p-6 text-slate-900 text-sm font-semibold border border-slate-200 ${
                        i === arr.length - 1 ? "rounded-bl-xl" : ""
                      }`}
                    >
                      {model}
                    </td>
                    {["mmlu", "bbh", "hellaswag"].map(
                      (metric, j, metricsArr) => (
                        <td
                          key={metric}
                          className={`p-6 text-slate-500 text-sm font-medium border border-slate-200 ${
                            i === arr.length - 1 && j === metricsArr.length - 1
                              ? "rounded-br-xl"
                              : ""
                          }`}
                        >
                          {infoA?.benchmarks[metric]
                            ? `${(infoA.benchmarks[metric] * 100).toFixed(1)}%`
                            : "-"}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strengths and Weaknesses Section */}
        <div className="self-stretch mb-8">
          <h2 className="text-black text-2xl font-bold font-['Inter'] mb-6">
            Strengths and Weaknesses
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              { model: modelA, info: infoA },
              { model: modelB, info: infoB },
            ].map(({ model, info }) => (
              <div
                key={model}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden"
              >
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                  <h3 className="text-slate-900 text-lg font-semibold">
                    {model}
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-sky-600 text-sm font-semibold mb-3">
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {info?.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-emerald-500 mr-2">✓</span>
                          <span className="text-slate-700 text-sm">
                            {strength}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sky-600 text-sm font-semibold mb-3">
                      Weaknesses
                    </h4>
                    <ul className="space-y-2">
                      {info?.weaknesses.map((weakness, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-red-400 mr-2">•</span>
                          <span className="text-slate-700 text-sm">
                            {weakness}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="self-stretch mb-8">
          <h2 className="text-black text-2xl font-bold font-['Inter'] mb-6">
            Which model should you pick?
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              { model: modelA, info: infoA },
              { model: modelB, info: infoB },
            ].map(({ model, info }) => (
              <div
                key={model}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden"
              >
                <div className="bg-sky-50 px-6 py-3 border-b border-slate-200">
                  <h3 className="text-slate-900 text-lg font-semibold">
                    {model}
                  </h3>
                </div>
                <div className="p-6">
                  <ul className="space-y-2">
                    {info?.recommendations?.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <span className="text-sky-500 mr-2">→</span>
                        <span className="text-slate-700 text-sm">
                          {rec.trim()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
        <RelatedComparisons
          modelA={modelA}
          providerA={providerA}
          modelB={modelB}
          providerB={providerB}
        />
      </div>
    </Card>
  );
}
