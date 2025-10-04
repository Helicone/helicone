import { XMarkIcon } from "@heroicons/react/24/outline";
import { Row } from "../../layout/common";
import React from "react";

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
                className="z-50 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-colors hover:bg-red-600"
                onClick={() => setRemoved(true)}
                aria-label="Remove demo"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
              <button
                className="flex h-12 cursor-pointer items-center justify-center rounded-full bg-blue-500 px-5 font-light text-white shadow-lg transition-colors hover:bg-blue-600"
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
