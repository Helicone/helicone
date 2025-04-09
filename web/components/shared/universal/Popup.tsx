import { Button } from "@/components/ui/button";
import { ReactNode, useEffect } from "react";
import { PiXBold } from "react-icons/pi";

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
  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

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
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center backdrop-blur-lg h-screen"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className={`max-h-[90vh] ${width} -mt-16 md:-mt-8 rounded-xl bg-slate-50 dark:bg-slate-950 border border-border flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex flex-row items-center justify-center border-b border-border p-2.5 gap-2.5 w-full">
          {/* Close Button */}
          {showCloseButton && (
            <Button
              variant="outline"
              size={"square_icon"}
              className="bg-slate-50 dark:bg-slate-950 rounded-full p-1.5 text-sm border border-border absolute left-2.5 text-secondary"
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
        {children}
      </div>
    </div>
  );
}
