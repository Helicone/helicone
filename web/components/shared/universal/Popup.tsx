import { ReactNode } from "react";
import { PiXBold } from "react-icons/pi";
import { Button } from "@/components/ui/button";

interface UniversalPopupProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
  showCloseButton?: boolean;
}

export default function UniversalPopup({
  title,
  isOpen,
  onClose,
  children,
  width = "max-w-5xl",
  showCloseButton = true,
}: UniversalPopupProps) {
  if (!isOpen) return null;

  let isMouseDownOnOverlay = false;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      isMouseDownOnOverlay = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && isMouseDownOnOverlay) {
      onClose();
    }
    isMouseDownOnOverlay = false;
  };

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/10 backdrop-blur-sm"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className={`${width} -mt-32 md:-mt-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex flex-row items-center justify-center border-b border-slate-200 dark:border-slate-800 p-2.5 gap-2.5 w-full">
          {/* Close Button */}
          {showCloseButton && (
            <Button
              variant="outline"
              size={"square_icon"}
              className="bg-white rounded-full p-2 text-sm border border-slate-100 absolute left-2.5"
              asPill
              onClick={onClose}
            >
              <PiXBold className="h-4 w-4" />
            </Button>
          )}
          {title && (
            <h2 className="text-lg font-semibold text-secondary">{title}</h2>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 p-4">{children}</div>
      </div>
    </div>
  );
}
