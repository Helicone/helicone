import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const EndOnboardingConfirmation = ({
  open,
  setOpen,
  onEnd,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onEnd: () => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="z-[10002]">
        <DialogHeader>
          <DialogTitle>🏁 Ready to integrate with Helicone?</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Don&apos;t worry, you can access this organization anytime from the
          sidebar.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Nevermind
          </Button>
          <Button onClick={onEnd}>Ready</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EndOnboardingConfirmation;
