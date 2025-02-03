import { Button } from "@/components/ui/button";

export default function BundlePromo() {
  return (
    <div className="flex flex-col pt-8 w-full relative">
      <div className="absolute right-0 w-[280px] h-full z-10">
        <img
          src="/static/pricing/infinite.svg"
          alt="Infinity pattern"
          className="absolute w-full h-[130%] object-contain -top-12"
        />
      </div>
      <div className="rounded-xl border-2 border-sky-500 flex relative overflow-hidden">
        <div className="grow p-6 bg-sky-50 flex-col gap-4 flex">
          <div className="flex-col">
            <div className="flex justify-start items-baseline w-full gap-4">
              <div className="text-black text-3xl font-semibold">
                All-Inclusive Team Bundle
              </div>
              <div className="flex items-baseline gap-2">
                <div className="flex items-baseline gap-1">
                  <div className="text-sky-500 text-2xl font-bold">$200</div>
                  <div className="text-slate-400 text-base font-medium">
                    /mo
                  </div>
                </div>
                <div className="text-slate-400 text-sm font-normal">
                  (Best value for teams)
                </div>
              </div>
            </div>
            <div className="text-slate-500 text-md mt-2">
              Get Pro features, all add-ons, and unlimited seats in one package
            </div>
          </div>
          <Button
            variant="default"
            size="lg"
            className="w-fit bg-sky-500 text-white font-bold text-md"
            onClick={() => (window.location.href = "/signup")}
          >
            Start 7-day free trial
          </Button>
        </div>
      </div>
    </div>
  );
}
