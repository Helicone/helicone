import { Card } from "@/components/ui/card";
import { ModelDetails } from "@helicone-package/cost/interfaces/Cost";
import Link from "next/link";

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

  if (!infoA || !infoB) return null;

  // Function to render benchmark bars
  const renderBenchmarkBar = (score: number | undefined, color: string) => {
    if (!score) return null;
    const percentage = score * 100;

    return (
      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 mb-1">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border border-slate-200 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h2 className="text-xl font-semibold text-slate-800">
          Model Capabilities Comparison
        </h2>
      </div>

      {/* Main content */}
      <div className="flex flex-col">
        {/* Capabilities Section */}
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-700 mb-4">
            Reported Capabilities
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Model A */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                <h4 className="text-sm font-medium text-slate-800">{modelA}</h4>
              </div>
              <ul className="space-y-2 pl-4">
                {infoA.capabilities.map((cap, i) => (
                  <li key={i} className="flex text-sm text-slate-600">
                    <span className="text-sky-500 mr-2">•</span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Model B */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                <h4 className="text-sm font-medium text-slate-800">{modelB}</h4>
              </div>
              <ul className="space-y-2 pl-4">
                {infoB.capabilities.map((cap, i) => (
                  <li key={i} className="flex text-sm text-slate-600">
                    <span className="text-sky-500 mr-2">•</span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Benchmarks Section */}
        <div className="px-6 py-5 border-b border-slate-200 bg-white">
          <h3 className="text-lg font-medium text-slate-700 mb-4">
            Benchmarks
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-1">
              <div className="px-4 py-3 bg-slate-50 rounded-lg">
                <div className="uppercase text-xs font-medium text-slate-500 mb-2">
                  Model
                </div>

                <div className="flex items-center mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                  <div className="text-sm font-medium text-slate-800">
                    {modelA}
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                  <div className="text-sm font-medium text-slate-800">
                    {modelB}
                  </div>
                </div>
              </div>
            </div>

            <div className="sm:col-span-1">
              <div className="px-4 py-3 bg-slate-50 rounded-lg">
                <div className="uppercase text-xs font-medium text-slate-500 mb-2">
                  MMLU
                </div>

                <div className="mb-6">
                  <div className="text-sm font-medium text-slate-800 mb-1">
                    {infoA.benchmarks?.mmlu
                      ? `${(infoA.benchmarks.mmlu * 100).toFixed(1)}%`
                      : "-"}
                  </div>
                  {renderBenchmarkBar(infoA.benchmarks?.mmlu, "bg-red-400")}
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-800 mb-1">
                    {infoB.benchmarks?.mmlu
                      ? `${(infoB.benchmarks.mmlu * 100).toFixed(1)}%`
                      : "-"}
                  </div>
                  {renderBenchmarkBar(infoB.benchmarks?.mmlu, "bg-blue-400")}
                </div>
              </div>
            </div>

            <div className="sm:col-span-1">
              <div className="px-4 py-3 bg-slate-50 rounded-lg">
                <div className="uppercase text-xs font-medium text-slate-500 mb-2">
                  BBH
                </div>

                <div className="mb-6">
                  <div className="text-sm font-medium text-slate-800 mb-1">
                    {infoA.benchmarks?.bbh
                      ? `${(infoA.benchmarks.bbh * 100).toFixed(1)}%`
                      : "-"}
                  </div>
                  {renderBenchmarkBar(infoA.benchmarks?.bbh, "bg-red-400")}
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-800 mb-1">
                    {infoB.benchmarks?.bbh
                      ? `${(infoB.benchmarks.bbh * 100).toFixed(1)}%`
                      : "-"}
                  </div>
                  {renderBenchmarkBar(infoB.benchmarks?.bbh, "bg-blue-400")}
                </div>
              </div>
            </div>

            <div className="sm:col-span-1">
              <div className="px-4 py-3 bg-slate-50 rounded-lg">
                <div className="uppercase text-xs font-medium text-slate-500 mb-2">
                  HellaSwag
                </div>

                <div className="mb-6">
                  <div className="text-sm font-medium text-slate-800 mb-1">
                    {infoA.benchmarks?.hellaswag
                      ? `${(infoA.benchmarks.hellaswag * 100).toFixed(1)}%`
                      : "-"}
                  </div>
                  {renderBenchmarkBar(
                    infoA.benchmarks?.hellaswag,
                    "bg-red-400",
                  )}
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-800 mb-1">
                    {infoB.benchmarks?.hellaswag
                      ? `${(infoB.benchmarks.hellaswag * 100).toFixed(1)}%`
                      : "-"}
                  </div>
                  {renderBenchmarkBar(
                    infoB.benchmarks?.hellaswag,
                    "bg-blue-400",
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths and Weaknesses */}
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-700 mb-4">
            Strengths and Weaknesses
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Model A */}
            <div>
              <div className="flex items-center mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                <h4 className="text-sm font-medium text-slate-800">{modelA}</h4>
              </div>

              <div className="mb-4 bg-emerald-50 p-4 rounded-lg">
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Strengths
                </h5>
                <ul className="space-y-2">
                  {infoA.strengths.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-emerald-500 mr-2 flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="text-sm text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Weaknesses
                </h5>
                <ul className="space-y-2">
                  {infoA.weaknesses.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-red-400 mr-2 flex-shrink-0 mt-0.5">
                        •
                      </span>
                      <span className="text-sm text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Model B */}
            <div>
              <div className="flex items-center mb-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                <h4 className="text-sm font-medium text-slate-800">{modelB}</h4>
              </div>

              <div className="mb-4 bg-emerald-50 p-4 rounded-lg">
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Strengths
                </h5>
                <ul className="space-y-2">
                  {infoB.strengths.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-emerald-500 mr-2 flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="text-sm text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Weaknesses
                </h5>
                <ul className="space-y-2">
                  {infoB.weaknesses.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-red-400 mr-2 flex-shrink-0 mt-0.5">
                        •
                      </span>
                      <span className="text-sm text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-medium text-slate-700 mb-4">
            Which model should you pick?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Model A */}
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex items-center mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                <h4 className="text-sm font-medium text-slate-800">{modelA}</h4>
              </div>

              <ul className="space-y-2">
                {infoA.recommendations?.map((rec, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-sky-500 mr-2 flex-shrink-0 mt-0.5">
                      →
                    </span>
                    <span className="text-sm text-slate-700">{rec.trim()}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Model B */}
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex items-center mb-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                <h4 className="text-sm font-medium text-slate-800">{modelB}</h4>
              </div>

              <ul className="space-y-2">
                {infoB.recommendations?.map((rec, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-sky-500 mr-2 flex-shrink-0 mt-0.5">
                      →
                    </span>
                    <span className="text-sm text-slate-700">{rec.trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Related Comparisons */}
        <div className="px-6 py-5">
          <h3 className="text-lg font-medium text-slate-700 mb-4">
            Related Comparisons
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {/* Related to Model A */}
            <div>
              <div className="flex items-center mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                <h4 className="text-sm font-medium text-slate-800">
                  Compare {modelA} with other models
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Popular models for comparison */}
                {[
                  "gpt-4-turbo",
                  "gpt-3.5-turbo",
                  "claude-3-opus",
                  "claude-3-sonnet",
                  "gemini-pro",
                  "llama-3-70b",
                ]
                  .filter((m) => m !== modelA && m !== modelB)
                  .map((relatedModel, i) => (
                    <Link
                      key={i}
                      href={`/comparison?modelA=${encodeURIComponent(
                        modelA,
                      )}&providerA=${encodeURIComponent(
                        providerA,
                      )}&modelB=${encodeURIComponent(
                        relatedModel,
                      )}&providerB=auto`}
                      className="text-sm text-sky-600 hover:text-sky-800 hover:underline py-1"
                    >
                      vs {relatedModel}
                    </Link>
                  ))}
              </div>

              {/* Link to view all comparisons */}
              <Link
                href={`/model/${encodeURIComponent(modelA)}/comparisons`}
                className="inline-flex items-center text-sm text-sky-600 hover:text-sky-800 mt-3 font-medium"
              >
                View all {modelA} comparisons →
              </Link>
            </div>

            {/* Related to Model B */}
            <div>
              <div className="flex items-center mb-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                <h4 className="text-sm font-medium text-slate-800">
                  Compare {modelB} with other models
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Popular models for comparison */}
                {[
                  "gpt-4-turbo",
                  "gpt-3.5-turbo",
                  "claude-3-opus",
                  "claude-3-sonnet",
                  "gemini-pro",
                  "llama-3-70b",
                ]
                  .filter((m) => m !== modelB && m !== modelA)
                  .map((relatedModel, i) => (
                    <Link
                      key={i}
                      href={`/comparison?modelA=${encodeURIComponent(
                        modelB,
                      )}&providerA=${encodeURIComponent(
                        providerB,
                      )}&modelB=${encodeURIComponent(
                        relatedModel,
                      )}&providerB=auto`}
                      className="text-sm text-sky-600 hover:text-sky-800 hover:underline py-1"
                    >
                      vs {relatedModel}
                    </Link>
                  ))}
              </div>

              {/* Link to view all comparisons */}
              <Link
                href={`/model/${encodeURIComponent(modelB)}/comparisons`}
                className="inline-flex items-center text-sm text-sky-600 hover:text-sky-800 mt-3 font-medium"
              >
                View all {modelB} comparisons →
              </Link>
            </div>
          </div>

          {/* Popular model comparison categories */}
          <div className="mt-6 bg-slate-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-slate-800 mb-3">
              Popular Model Comparison Categories
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Link
                href="/comparisons/openai"
                className="text-sm text-sky-600 hover:text-sky-800 hover:underline py-1"
              >
                OpenAI Models
              </Link>
              <Link
                href="/comparisons/anthropic"
                className="text-sm text-sky-600 hover:text-sky-800 hover:underline py-1"
              >
                Anthropic Models
              </Link>
              <Link
                href="/comparisons/google"
                className="text-sm text-sky-600 hover:text-sky-800 hover:underline py-1"
              >
                Google Models
              </Link>
              <Link
                href="/comparisons/open-source"
                className="text-sm text-sky-600 hover:text-sky-800 hover:underline py-1"
              >
                Open Source Models
              </Link>
              <Link
                href="/comparisons/best-for-coding"
                className="text-sm text-sky-600 hover:text-sky-800 hover:underline py-1"
              >
                Best for Coding
              </Link>
              <Link
                href="/comparisons/best-for-chat"
                className="text-sm text-sky-600 hover:text-sky-800 hover:underline py-1"
              >
                Best for Chat
              </Link>
              <Link
                href="/comparisons/fastest"
                className="text-sm text-sky-600 hover:text-sky-800 hover:underline py-1"
              >
                Fastest Models
              </Link>
              <Link
                href="/comparisons/"
                className="text-sm text-sky-600 hover:text-sky-800 hover:underline py-1"
              >
                All Comparisons
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
