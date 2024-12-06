import useOnboardingContext from "@/components/layout/onboardingContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

const EndOnboardingConfirmation = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const { endOnboarding } = useOnboardingContext();
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogOverlay className="z-[10001]" />
      <DialogContent className="z-[10002]">
        <DialogHeader>
          <DialogTitle>End tour?</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          The rest of the tour will show you how Helicone can help you debug and
          monitor your LLM application. Would you like to end the tour here?
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Nevermind
          </Button>
          <Button
            onClick={() => {
              endOnboarding();
              setOpen(false);
              router.push("/dashboard");
            }}
          >
            Yes, end the tour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EndOnboardingConfirmation;
