import { AlertCircle, AlertTriangle, DollarSign, CheckCircle } from "lucide-react";
import { cn, ISLAND_WIDTH } from "@/lib/utils";

const Problem = () => {
  return (
    <section className="w-full bg-white pt-16 sm:pt-24">
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", ISLAND_WIDTH)}>
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Building agents is still too hard
          </h2>
          <p className="text-lg font-normal sm:text-xl text-muted-foreground mx-auto">
            Multi-step, multi-model AI workflows fail in unpredictable ways
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="group bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 hover:border-slate-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-center w-12 h-12 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-500">
              <AlertCircle size={24} />
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-red-500 mb-3">
              Visibility Gap
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Debugging multi-step failiures
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Trace through LLM calls, tool invocations, and model switches to
              find the one step that fails.
            </p>
            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 font-mono text-xs">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <span className="text-slate-300 min-w-[60px]">step_1</span>
                <span>→</span>
                <span>llm_call</span>
                <span className="ml-auto text-slate-500">$0.02</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <span className="text-slate-300 min-w-[60px]">step_2</span>
                <span>→</span>
                <span>tool_use</span>
                <span className="ml-auto text-slate-500">$0.00</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-slate-300 min-w-[60px]">step_3</span>
                <span>→</span>
                <span className="text-red-400">??? failed ???</span>
                <span className="ml-auto text-slate-500">$0.15</span>
              </div>
            </div>
          </div>

          <div className="group bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 hover:border-slate-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-center w-12 h-12 mb-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-500">
              <AlertTriangle size={24} />
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-amber-500 mb-3">
              Multi-model chaos
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Reliability across providers & tools
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Multiple SDKs & API keys. No automatic failover. No unified
              interface.
            </p>
            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 font-mono text-xs">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-slate-300 min-w-[70px]">openai</span>
                <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-[10px]">
                  503 DOWN
                </span>
                <span className="ml-auto text-slate-500">—</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-slate-300 min-w-[70px]">anthropic</span>
                <span className="px-2 py-1 bg-amber-900/30 text-amber-400 rounded text-[10px]">
                  SLOW 8.2s
                </span>
                <span className="ml-auto text-slate-500">—</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-300 min-w-[70px]">together</span>
                <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded text-[10px]">
                  200 OK
                </span>
                <span className="ml-auto text-slate-500">—</span>
              </div>
            </div>
          </div>

          <div className="group bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 hover:border-slate-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-center w-12 h-12 mb-6 bg-sky-50 border border-sky-200 rounded-xl text-sky-500">
              <DollarSign size={24} />
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-sky-500 mb-3">
              Cost Tracking
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">
              Cost attribution & control
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Reasoning loops, retries, model switches, tool calls, can all double your spend quickly.
            </p>
            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 font-mono text-xs">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-slate-400 text-[11px] min-w-[50px]">
                  Unknown
                </span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: "90%" }}
                  ></div>
                </div>
                <span className="text-red-400 text-[11px] min-w-[50px] text-right">
                  $8,420
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-slate-400 text-[11px] min-w-[50px]">
                  Retries
                </span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: "65%" }}
                  ></div>
                </div>
                <span className="text-amber-400 text-[11px] min-w-[50px] text-right">
                  $2,847
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-[11px] min-w-[50px]">
                  Actual
                </span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: "30%" }}
                  ></div>
                </div>
                <span className="text-emerald-400 text-[11px] min-w-[50px] text-right">
                  $1,580
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Problem;

