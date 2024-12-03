import { Card } from "@/components/ui/card";

interface BenchmarkData {
  model: string;
  average: number;
  ifeval: number;
  bbh: number;
  hellaswag: number;
  mmlu: number;
}

interface StrengthWeakness {
  strengths: string[];
  weaknesses: string[];
}

interface ModelCapabilitiesCardProps {
  modelA: string;
  modelB: string;
  modelACapabilities: string[];
  modelBCapabilities: string[];
  benchmarkData: {
    [key: string]: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export default function ModelCapabilitiesCard({
  modelA,
  modelB,
  modelACapabilities,
  modelBCapabilities,
  benchmarkData,
  strengths,
  weaknesses,
  recommendations,
}: ModelCapabilitiesCardProps) {
  return (
    <Card className="p-8">
      <div className="flex-col justify-start items-start gap-[60px]">
        {/* Capabilities Section */}
        <div className="self-stretch mb-8">
          <h2 className="text-black text-2xl font-bold font-['Inter'] mb-6">
            Reported Capabilities
          </h2>
          <div className="text-slate-900 text-base font-medium font-['Inter'] leading-normal mb-2">
            Capabilities of {modelA}...
            {modelACapabilities.map((cap, i) => (
              <div key={i}>{cap}</div>
            ))}
          </div>
          <div className="text-slate-900 text-base font-medium font-['Inter'] leading-normal">
            Capabilities of {modelB}...
            {modelBCapabilities.map((cap, i) => (
              <div key={i}>{cap}</div>
            ))}
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
                  {["Average", "IFEval", "BBH", "HellaSwag", "MMLU"].map(
                    (header, i, arr) => (
                      <th
                        key={header}
                        className={`p-6 text-left text-slate-500 text-sm font-semibold border border-slate-200 ${
                          i === arr.length - 1 ? "rounded-tr-xl" : ""
                        }`}
                      >
                        {header}
                      </th>
                    )
                  )}
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
                    {["average", "ifeval", "bbh", "hellaswag", "mmlu"].map(
                      (metric, j, metricsArr) => (
                        <td
                          key={metric}
                          className={`p-6 text-slate-500 text-sm font-medium border border-slate-200 ${
                            i === arr.length - 1 && j === metricsArr.length - 1
                              ? "rounded-br-xl"
                              : ""
                          }`}
                        >
                          {benchmarkData[metric]}
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
          {[modelA, modelB].map((model) => (
            <div key={model} className="mb-6">
              <div className="text-slate-900 text-base font-medium mb-3">
                {model}
              </div>
              <div className="px-4 py-3 bg-white rounded-md flex">
                <div className="w-[300px]">
                  <div className="text-[#0da5e8] text-sm font-medium mb-1.5">
                    Strengths
                  </div>
                  <div className="text-slate-400 text-sm font-medium">
                    {strengths.map((strength, i) => (
                      <div key={i}>{strength}</div>
                    ))}
                  </div>
                </div>
                <div className="w-[300px]">
                  <div className="text-[#0da5e8] text-sm font-medium mb-1.5">
                    Weaknesses
                  </div>
                  <div className="text-slate-400 text-sm font-medium">
                    {weaknesses.map((weakness, i) => (
                      <div key={i}>{weakness}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations Section */}
        <div className="self-stretch mb-8">
          <h2 className="text-black text-2xl font-bold font-['Inter'] mb-6">
            Which model should you pick?
          </h2>
          {[modelA, modelB].map((model) => (
            <div
              key={model}
              className="text-slate-900 text-base font-medium leading-normal mb-2"
            >
              {model} is recommended for {recommendations}
            </div>
          ))}
        </div>

        {/* References Section */}
        <div className="self-stretch">
          <h2 className="text-black text-2xl font-bold font-['Inter'] mb-6">
            References
          </h2>
          <div className="text-slate-900 text-base font-medium leading-normal">
            This leaderboard presents models' performance metrics, including
            pricing and capabilities, based on benchmark data from their
            technical reports. Updated December 2024.
          </div>
        </div>
      </div>
    </Card>
  );
}
