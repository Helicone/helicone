import { XMarkIcon } from "@heroicons/react/24/outline";
import { Row } from "../../layout/common";

interface ThemedBubbleModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  setRemoved: (removed: boolean) => void;
  removed: boolean;
  children: React.ReactNode;
  buttonText?: string;
  showButton?: boolean;
}

const ThemedBubbleModal: React.FC<ThemedBubbleModalProps> = ({
  open,
  setOpen,
  setRemoved,
  removed,
  children,
  buttonText = "Demo 🚀",
  showButton = true,
}) => {
  if (removed) return null;

  return (
    <>
      {!open && (
        <Row className="fixed bottom-4 right-4 z-50 items-center gap-2">
          {showButton && (
            <>
              <button
                className="z-50 w-8 h-8 rounded-full bg-red-500 shadow-lg cursor-pointer flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                onClick={() => setRemoved(true)}
                aria-label="Remove demo"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
              <button
                className="px-5 font-light h-12 rounded-full bg-blue-500 shadow-lg cursor-pointer flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
                onClick={() => setOpen(true)}
              >
                {buttonText}
              </button>
            </>
          )}
        </Row>
      )}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 origin-bottom-right">
          {children}
        </div>
      )}
    </>
  );
};

export default ThemedBubbleModal;
