import React, { useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { X, ZoomIn, ZoomOut, RotateCw, Maximize2 } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  alt?: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  alt = "",
}) => {
  // Store the original overflow value to restore it later
  const originalOverflowRef = useRef<string | null>(null);
  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      // Store original overflow value before changing it
      originalOverflowRef.current = document.body.style.overflow || "";

      // Use capture phase to handle event before other listeners
      document.addEventListener("keydown", handleEscape, true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleEscape, true);
        // Restore the original overflow value only when modal was open
        if (originalOverflowRef.current !== null) {
          document.body.style.overflow = originalOverflowRef.current;
          originalOverflowRef.current = null;
        }
      };
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />

      {/* Content */}
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={5}
          centerOnInit={true}
          limitToBounds={false}
          doubleClick={{
            mode: "toggle",
            step: 1,
          }}
          panning={{
            excluded: ["button"],
          }}
        >
          {({ zoomIn, zoomOut, resetTransform, centerView }) => (
            <>
              {/* Controls */}
              <div className="absolute right-4 top-4 z-50 flex flex-col gap-2">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="flex items-center justify-center rounded-lg bg-white/10 p-2 backdrop-blur-sm transition-colors hover:bg-white/20"
                  title="Close (Esc)"
                >
                  <X className="h-5 w-5 text-white" />
                </button>

                {/* Zoom controls */}
                <div className="flex flex-col gap-2 rounded-lg bg-white/10 p-2 backdrop-blur-sm">
                  <button
                    onClick={() => zoomIn()}
                    className="flex items-center justify-center rounded p-1.5 transition-colors hover:bg-white/20"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-5 w-5 text-white" />
                  </button>
                  <button
                    onClick={() => zoomOut()}
                    className="flex items-center justify-center rounded p-1.5 transition-colors hover:bg-white/20"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-5 w-5 text-white" />
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="flex items-center justify-center rounded p-1.5 transition-colors hover:bg-white/20"
                    title="Reset"
                  >
                    <RotateCw className="h-5 w-5 text-white" />
                  </button>
                  <button
                    onClick={() => centerView()}
                    className="flex items-center justify-center rounded p-1.5 transition-colors hover:bg-white/20"
                    title="Center"
                  >
                    <Maximize2 className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                <p className="text-sm text-white/80">
                  Scroll to zoom • Drag to pan • Double-click to zoom
                </p>
              </div>

              {/* Image container */}
              <TransformComponent
                wrapperStyle={{
                  width: "100%",
                  height: "100%",
                }}
                contentStyle={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt={alt}
                  className="max-h-[90vh] max-w-[90vw] object-contain"
                  style={{ userSelect: "none" }}
                  draggable={false}
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
    </div>
  );

  // Render modal at document body level using Portal
  return ReactDOM.createPortal(modalContent, document.body);
};
