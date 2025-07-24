import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RabbitIcon, TurtleIcon } from "lucide-react";

const OnboardingDemoModal = ({
  open,
  quickStart,
  quickTour,
}: {
  open: boolean;
  quickStart: () => void;
  quickTour: () => void;
}) => {
  return (
    <Dialog open={open}>
      <DialogContent
        className="w-11/12 gap-8 rounded-md sm:max-w-2xl"
        closeButton={false}
      >
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <DialogTitle>Welcome to Helicone!</DialogTitle>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            onClick={quickStart}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <TurtleIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium leading-4 text-slate-900 dark:text-slate-50">
                  Get integrated
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Jump straight to integrating Helicone into your LLM app
                </p>
              </div>
            </div>
          </div>
          <div
            className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            onClick={quickTour}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <RabbitIcon className="h-6 w-6 text-blue-500" />
                <div className="rounded-md bg-blue-100 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
                  2 Min Tour
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium leading-4 text-slate-900 dark:text-slate-50">
                  Watch how it works
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  See how top companies monitor and improve their LLM apps with
                  Helicone
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDemoModal;
