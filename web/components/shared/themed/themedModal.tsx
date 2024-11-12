import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";

interface ThemedModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
}

const ThemedModal = (props: ThemedModalProps) => {
  const { open, setOpen, children } = props;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogPortal>
        <DialogOverlay className="bg-slate-300/50 dark:bg-slate-950/50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <DialogContent className="max-h-[90vh] w-fit overflow-auto">
            {children}
          </DialogContent>
        </div>
      </DialogPortal>
    </Dialog>
  );
};

export default ThemedModal;
