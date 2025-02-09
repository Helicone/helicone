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
  isUpgrade = false,
}: {
  featureName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  isUpgrade?: boolean;
}) => {
  const actionText = isUpgrade ? "Upgrade" : "Start Trial";
  const titleText = isUpgrade
    ? `Enable ${featureName}`
    : `Start ${featureName} Trial`;
  const descriptionText = isUpgrade
    ? `Would you like to enable ${featureName}? This will add it to your current subscription.`
    : `Would you like to start your ${featureName} trial? You can cancel anytime during the trial period.`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titleText}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>{actionText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
