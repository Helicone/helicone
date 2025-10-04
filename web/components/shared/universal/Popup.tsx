import { Button } from "@/components/ui/button";
import React, { ReactNode, useEffect } from "react";
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
      className="fixed inset-0 z-[9999] flex h-screen flex-col items-center justify-center backdrop-blur-lg"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className={`max-h-[90vh] ${width} -mt-16 flex flex-col rounded-xl border border-border bg-slate-50 dark:bg-slate-950 md:-mt-8`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex w-full flex-row items-center justify-center gap-2.5 border-b border-border p-2.5">
          {/* Close Button */}
          {showCloseButton && (
            <Button
              variant="outline"
              size={"square_icon"}
              className="absolute left-2.5 rounded-full border border-border bg-slate-50 p-1.5 text-sm text-secondary dark:bg-slate-950"
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
