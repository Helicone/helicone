import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ThemedModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

const ThemedModal = (props: ThemedModalProps) => {
  const { open, setOpen, children, className } = props;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={className ?? "max-h-[90vh] w-fit max-w-[90vw] overflow-auto"}>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default ThemedModal;
