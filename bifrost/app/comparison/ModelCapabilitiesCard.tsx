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
      <div className="mb-1 mt-1.5 h-1.5 w-full rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  return (
    <Card className="mx-auto max-w-5xl overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h2 className="text-xl font-semibold text-slate-800">
          Model Capabilities Comparison
        </h2>
      </div>

      {/* Main content */}
      <div className="flex flex-col">
        {/* Capabilities Section */}
        <div className="border-b border-slate-200 px-6 py-5">
          <h3 className="mb-4 text-lg font-medium text-slate-700">
            Reported Capabilities
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Model A */}
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="mb-3 flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-red-500" />
                <h4 className="text-sm font-medium text-slate-800">{modelA}</h4>
              </div>
              <ul className="space-y-2 pl-4">
                {infoA.capabilities.map((cap, i) => (
                  <li key={i} className="flex text-sm text-slate-600">
                    <span className="mr-2 text-sky-500">•</span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Model B */}
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="mb-3 flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-blue-500" />
                <h4 className="text-sm font-medium text-slate-800">{modelB}</h4>
              </div>
              <ul className="space-y-2 pl-4">
                {infoB.capabilities.map((cap, i) => (
                  <li key={i} className="flex text-sm text-slate-600">
                    <span className="mr-2 text-sky-500">•</span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Benchmarks Section */}
        <div className="border-b border-slate-200 bg-white px-6 py-5">
          <h3 className="mb-4 text-lg font-medium text-slate-700">
            Benchmarks
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="sm:col-span-1">
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <div className="mb-2 text-xs font-medium uppercase text-slate-500">
                  Model
                </div>

                <div className="mb-6 flex items-center">
                  <div className="mr-2 h-3 w-3 rounded-full bg-red-500" />
                  <div className="text-sm font-medium text-slate-800">
                    {modelA}
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="mr-2 h-3 w-3 rounded-full bg-blue-500" />
                  <div className="text-sm font-medium text-slate-800">
                    {modelB}
                  </div>
                </div>
              </div>
            </div>

            <div className="sm:col-span-1">
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <div className="mb-2 text-xs font-medium uppercase text-slate-500">
                  MMLU
                </div>

                <div className="mb-6">
                  <div className="mb-1 text-sm font-medium text-slate-800">
                    {infoA.benchmarks?.mmlu
                      ? `${(infoA.benchmarks.mmlu * 100).toFixed(1)}%`
                      : "-"}
                  </div>
                  {renderBenchmarkBar(infoA.benchmarks?.mmlu, "bg-red-400")}
                </div>

                <div>
                  <div className="mb-1 text-sm font-medium text-slate-800">
                    {infoB.benchmarks?.mmlu
                      ? `${(infoB.benchmarks.mmlu * 100).toFixed(1)}%`
                      : "-"}
                  </div>
                  {renderBenchmarkBar(infoB.benchmarks?.mmlu, "bg-blue-400")}
                </div>
              </div>
            </div>

            <div className="sm:col-span-1">
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <div className="mb-2 text-xs font-medium uppercase text-slate-500">
                  BBH
                </div>

                <div className="mb-6">
                  <div className="mb-1 text-sm font-medium text-slate-800">
                    {infoA.benchmarks?.bbh
                      ? `${(infoA.benchmarks.bbh * 100).toFixed(1)}%`
                      : "-"}
                  </div>
                  {renderBenchmarkBar(infoA.benchmarks?.bbh, "bg-red-400")}
                </div>

                <div>
                  <div className="mb-1 text-sm font-medium text-slate-800">
                    {infoB.benchmarks?.bbh
                      ? `${(infoB.benchmarks.bbh * 100).toFixed(1)}%`
                      : "-"}
                  </div>
                  {renderBenchmarkBar(infoB.benchmarks?.bbh, "bg-blue-400")}
                </div>
              </div>
            </div>

            <div className="sm:col-span-1">
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <div className="mb-2 text-xs font-medium uppercase text-slate-500">
                  HellaSwag
                </div>

                <div className="mb-6">
                  <div className="mb-1 text-sm font-medium text-slate-800">
                    {infoA.benchmarks?.hellaswag
                      ? `${(infoA.benchmarks.hellaswag * 100).toFixed(1)}%`
                      : "-"}
                  </div>
                  {renderBenchmarkBar(
                    infoA.benchmarks?.hellaswag,
                    "bg-red-400"
                  )}
                </div>

                <div>
                  <div className="mb-1 text-sm font-medium text-slate-800">
                    {infoB.benchmarks?.hellaswag
                      ? `${(infoB.benchmarks.hellaswag * 100).toFixed(1)}%`
                      : "-"}
                  </div>
                  {renderBenchmarkBar(
                    infoB.benchmarks?.hellaswag,
                    "bg-blue-400"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths and Weaknesses */}
        <div className="border-b border-slate-200 px-6 py-5">
          <h3 className="mb-4 text-lg font-medium text-slate-700">
            Strengths and Weaknesses
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Model A */}
            <div>
              <div className="mb-3 flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-red-500" />
                <h4 className="text-sm font-medium text-slate-800">{modelA}</h4>
              </div>

              <div className="mb-4 rounded-lg bg-emerald-50 p-4">
                <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Strengths
                </h5>
                <ul className="space-y-2">
                  {infoA.strengths.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 mt-0.5 flex-shrink-0 text-emerald-500">
                        ✓
                      </span>
                      <span className="text-sm text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg bg-red-50 p-4">
                <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Weaknesses
                </h5>
                <ul className="space-y-2">
                  {infoA.weaknesses.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 mt-0.5 flex-shrink-0 text-red-400">
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
              <div className="mb-3 flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-blue-500" />
                <h4 className="text-sm font-medium text-slate-800">{modelB}</h4>
              </div>

              <div className="mb-4 rounded-lg bg-emerald-50 p-4">
                <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Strengths
                </h5>
                <ul className="space-y-2">
                  {infoB.strengths.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 mt-0.5 flex-shrink-0 text-emerald-500">
                        ✓
                      </span>
                      <span className="text-sm text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg bg-red-50 p-4">
                <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Weaknesses
                </h5>
                <ul className="space-y-2">
                  {infoB.weaknesses.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 mt-0.5 flex-shrink-0 text-red-400">
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
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <h3 className="mb-4 text-lg font-medium text-slate-700">
            Which model should you pick?
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Model A */}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-red-500" />
                <h4 className="text-sm font-medium text-slate-800">{modelA}</h4>
              </div>

              <ul className="space-y-2">
                {infoA.recommendations?.map((rec, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 mt-0.5 flex-shrink-0 text-sky-500">
                      →
                    </span>
                    <span className="text-sm text-slate-700">{rec.trim()}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Model B */}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-blue-500" />
                <h4 className="text-sm font-medium text-slate-800">{modelB}</h4>
              </div>

              <ul className="space-y-2">
                {infoB.recommendations?.map((rec, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 mt-0.5 flex-shrink-0 text-sky-500">
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
          <h3 className="mb-4 text-lg font-medium text-slate-700">
            Related Comparisons
          </h3>

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {/* Related to Model A */}
            <div>
              <div className="mb-3 flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-red-500" />
                <h4 className="text-sm font-medium text-slate-800">
                  Compare {modelA} with other models
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                        modelA
                      )}&providerA=${encodeURIComponent(
                        providerA
                      )}&modelB=${encodeURIComponent(
                        relatedModel
                      )}&providerB=auto`}
                      className="py-1 text-sm text-sky-600 hover:text-sky-800 hover:underline"
                    >
                      vs {relatedModel}
                    </Link>
                  ))}
              </div>

              {/* Link to view all comparisons */}
              <Link
                href={`/model/${encodeURIComponent(modelA)}/comparisons`}
                className="mt-3 inline-flex items-center text-sm font-medium text-sky-600 hover:text-sky-800"
              >
                View all {modelA} comparisons →
              </Link>
            </div>

            {/* Related to Model B */}
            <div>
              <div className="mb-3 flex items-center">
                <div className="mr-2 h-3 w-3 rounded-full bg-blue-500" />
                <h4 className="text-sm font-medium text-slate-800">
                  Compare {modelB} with other models
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                        modelB
                      )}&providerA=${encodeURIComponent(
                        providerB
                      )}&modelB=${encodeURIComponent(
                        relatedModel
                      )}&providerB=auto`}
                      className="py-1 text-sm text-sky-600 hover:text-sky-800 hover:underline"
                    >
                      vs {relatedModel}
                    </Link>
                  ))}
              </div>

              {/* Link to view all comparisons */}
              <Link
                href={`/model/${encodeURIComponent(modelB)}/comparisons`}
                className="mt-3 inline-flex items-center text-sm font-medium text-sky-600 hover:text-sky-800"
              >
                View all {modelB} comparisons →
              </Link>
            </div>
          </div>

          {/* Popular model comparison categories */}
          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-medium text-slate-800">
              Popular Model Comparison Categories
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Link
                href="/comparisons/openai"
                className="py-1 text-sm text-sky-600 hover:text-sky-800 hover:underline"
              >
                OpenAI Models
              </Link>
              <Link
                href="/comparisons/anthropic"
                className="py-1 text-sm text-sky-600 hover:text-sky-800 hover:underline"
              >
                Anthropic Models
              </Link>
              <Link
                href="/comparisons/google"
                className="py-1 text-sm text-sky-600 hover:text-sky-800 hover:underline"
              >
                Google Models
              </Link>
              <Link
                href="/comparisons/open-source"
                className="py-1 text-sm text-sky-600 hover:text-sky-800 hover:underline"
              >
                Open Source Models
              </Link>
              <Link
                href="/comparisons/best-for-coding"
                className="py-1 text-sm text-sky-600 hover:text-sky-800 hover:underline"
              >
                Best for Coding
              </Link>
              <Link
                href="/comparisons/best-for-chat"
                className="py-1 text-sm text-sky-600 hover:text-sky-800 hover:underline"
              >
                Best for Chat
              </Link>
              <Link
                href="/comparisons/fastest"
                className="py-1 text-sm text-sky-600 hover:text-sky-800 hover:underline"
              >
                Fastest Models
              </Link>
              <Link
                href="/comparisons/"
                className="py-1 text-sm text-sky-600 hover:text-sky-800 hover:underline"
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
