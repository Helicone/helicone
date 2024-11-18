import { ArrowUpRightIcon, Link } from "lucide-react";
import { Button } from "../ui/button";

const Log = () => {
  return (
    <div className="w-full pl-4 sm:pl-16 md:pl-24 2xl:pl-40 max-w-[2000px] mx-auto pt-28">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="flex flex-col gap-9">
          <div className="flex items-center gap-2.5">
            <p className="text-xl">01</p>
            <div className="text-lg font-medium text-slate-700">Log</div>
          </div>
          <div className="flex flex-col gap-6">
            <h2 className="font-semibold text-5xl leading-[120%] max-w-[600px] text-wrap text-black">
              Dive deep into each trace and debug your agent with ease
            </h2>
            <p className="text-lg max-w-[520px]">
              Visualize your multi-step LLM interactions, log requests in
              real-time and pinpoint root cause of errors.
            </p>
          </div>
          <a href="https://docs.helicone.ai/features/sessions" target="_blank">
            <Button
              className="items-center gap-2 text-landing-secondary self-start"
              variant="outline"
            >
              <ArrowUpRightIcon className="w-4 h-4" />
              Sessions
            </Button>
          </a>
        </div>
        <img src="/static/home/log.png" alt="Log" />
      </div>
    </div>
  );
};

export default Log;
