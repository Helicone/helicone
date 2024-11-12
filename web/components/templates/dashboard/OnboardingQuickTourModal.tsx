import useOnboardingContext from "@/components/layout/onboardingContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const checklistItems = [
  "Review the requests",
  "Trace your agent",
  "Improve your prompt",
  "Experiment with production data",
  "View metrics on dashboard",
];

const OnboardingQuickTourModal = ({
  open,
  back,
  startTour,
  integrateApp,
}: {
  open: boolean;
  back: () => void;
  startTour: () => void;
  integrateApp: () => void;
}) => {
  const { isOnboardingComplete } = useOnboardingContext();

  return (
    <Dialog open={open}>
      <DialogContent
        className="w-11/12 sm:max-w-2xl gap-8 rounded-md"
        closeButton={false}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle>Take a quick tour</DialogTitle>
          <DialogDescription>
            Think of yourself as the AI engineer working at Xpedia. A user
            reports that the app is providing unreliable travel plan. Let’s
            diagnose and resolve the issue.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/welcome/xpedia.png"
              alt="Xpedia"
              className="rounded-md w-full h-auto"
            />

            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50 leading-4">
                Xpedia AI
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                AI-powered travel planner to streamline trip planning. Find
                flights, accommodation and activities at your fingertip.
              </p>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Checklist
            </h3>
            <div className="flex flex-col gap-3">
              {checklistItems.map((item) => (
                <div className="flex items-center gap-2" key={item}>
                  <Checkbox
                    disabled
                    className="border-gray-200 dark:border-gray-800 data-[state=checked]:bg-[#34C759] data-[state=checked]:text-white data-[state=checked]:rounded-full disabled:opacity-100"
                    iconClassName="h-3 w-3"
                    checked={isOnboardingComplete}
                  />
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          {!isOnboardingComplete ? (
            <>
              <Button variant="outline" onClick={back}>
                Go Back
              </Button>
              <Button onClick={startTour}>Let&apos;s go!</Button>
            </>
          ) : (
            <Button onClick={integrateApp}>Integrate my app</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingQuickTourModal;
