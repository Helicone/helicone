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
import { Loader2 } from "lucide-react";
import { useState } from "react";

const ONBOARDING_CONFIG = {
  CHECKLIST_ITEMS: [
    "Review the requests",
    "Trace your agent",
    "Improve your prompt",
    "Experiment with production data",
    "View metrics on dashboard",
  ],
  DEMO_APP: {
    name: "Xpedia",
    description:
      "We've set up a demo travel app to help you learn the ropes. Follow along with this example to see how everything works.",
    imagePath: "/assets/welcome/xpedia.png",
  },
} as const;

// Simplified but informative demo preview
const DemoAppPreview = () => (
  <div className="flex flex-col gap-6">
    {/* <img
      src={ONBOARDING_CONFIG.DEMO_APP.imagePath}
      alt={ONBOARDING_CONFIG.DEMO_APP.name}
      className="rounded-md w-full h-auto max-w-[300px] mx-auto"
    /> */}
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {ONBOARDING_CONFIG.DEMO_APP.name}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {ONBOARDING_CONFIG.DEMO_APP.description}
      </p>
    </div>
  </div>
);

const CompletionEmoji = () => (
  <div className="flex items-center justify-center w-full h-full text-9xl">
    🎉
  </div>
);

const ChecklistItem = ({
  item,
  checked,
  stepNumber,
}: {
  item: string;
  checked: boolean;
  stepNumber: number;
}) => (
  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
    <span className="text-xs font-medium text-blue-500 dark:text-blue-400 w-4">
      {stepNumber}.
    </span>
    <Checkbox
      disabled
      className="border-2 border-slate-200 dark:border-slate-700 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
      checked={checked}
    />
    <p className="text-sm text-slate-700 dark:text-slate-300">{item}</p>
  </div>
);

// Main component with clearer type definition
interface OnboardingQuickTourModalProps {
  open: boolean;
  back: () => void;
  startTour: () => void;
  integrateApp: () => void;
}

const OnboardingQuickTourModal = ({
  open,
  back,
  startTour,
  integrateApp,
}: OnboardingQuickTourModalProps) => {
  const [loading, setLoading] = useState(false);
  const { isOnboardingComplete } = useOnboardingContext();

  return (
    <Dialog open={open}>
      <DialogContent className="w-11/12 sm:max-w-[500px] gap-8 rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            {isOnboardingComplete ? "You're all set! 🎉" : "Quick Tour"}
          </DialogTitle>
          <DialogDescription className="text-center text-slate-500">
            {isOnboardingComplete
              ? "Ready to integrate these concepts into your own app?"
              : "Let's explore Helicone with a practical example"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-8">
          <div className="rounded-lg">
            {!isOnboardingComplete ? <DemoAppPreview /> : <CompletionEmoji />}
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {isOnboardingComplete
                ? "What you've learned:"
                : "Your learning path:"}
            </h4>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col gap-1">
                {ONBOARDING_CONFIG.CHECKLIST_ITEMS.map((item, index) => (
                  <ChecklistItem
                    key={item}
                    item={item}
                    checked={isOnboardingComplete}
                    stepNumber={index + 1}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!isOnboardingComplete ? (
            <>
              <Button
                variant="outline"
                onClick={back}
                className="border-2 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Back
              </Button>
              <Button
                disabled={loading}
                onClick={() => {
                  setLoading(true);
                  startTour();
                }}
                className="bg-blue-500 hover:bg-blue-600 font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Start Learning"
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={integrateApp}
              className="bg-blue-500 hover:bg-blue-600 w-full font-medium"
            >
              Apply to My App
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingQuickTourModal;
