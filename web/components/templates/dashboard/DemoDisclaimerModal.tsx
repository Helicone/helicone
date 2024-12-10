import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DemoDisclaimerModal = ({
  open,
  setOpen,
  onSuccess,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🎉 Welcome to Helicone!</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          We created a demo organization for you. Feel free to explore, and when
          you&apos;re done, just click on{" "}
          <span className="font-semibold">Ready to Integrate</span> in the
          sidebar.
        </DialogDescription>
        <DialogFooter>
          <Button
            onClick={() => {
              onSuccess();
              setOpen(false);
            }}
          >
            Start Exploring
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DemoDisclaimerModal;
