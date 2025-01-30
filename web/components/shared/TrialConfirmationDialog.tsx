import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const TrialConfirmationDialog = ({
  featureName,
  isOpen,
  onOpenChange,
  onConfirm,
}: {
  featureName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Start {featureName} Trial</DialogTitle>
        <DialogDescription>
          Would you like to start your {featureName} trial? You can cancel
          anytime during the trial period.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>Start Trial</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
