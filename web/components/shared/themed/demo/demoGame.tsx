import StartPage from "./startPage";
import { XMarkIcon } from "@heroicons/react/24/outline";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Resizable } from "re-resizable";

const calculateInitialPosition = () => {
  if (typeof window === "undefined") return { x: 20, y: 20 }; // Default for SSR
  const padding = 20; // Distance from the edges
  return {
    x: window.innerWidth - 500 - padding, // Assuming max width of 500px
    y: window.innerHeight - 600 - padding, // Assuming max height of 600px
  };
};

export const DemoGame = ({
  setOpenDemo,
}: {
  setOpenDemo: (open: boolean) => void;
}) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 360, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    if (dragRef.current && dragRef.current.contains(e.target as Node)) {
      setIsDragging(true);
    }
  };

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition((prev) => ({
          x: prev.x + e.movementX,
          y: prev.y + e.movementY,
        }));
      }
    },
    [isDragging],
  );

  const onMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, onMouseMove]);

  useEffect(() => {
    setPosition(calculateInitialPosition());
  }, []);

  useEffect(() => {
    setPosition(calculateInitialPosition());
  }, []);

  return (
    <Resizable
      size={{ width: size.width, height: size.height }}
      onResizeStop={(e, direction, ref, d) => {
        setSize({
          width: size.width + d.width,
          height: size.height + d.height,
        });
      }}
      minWidth={300}
      minHeight={400}
      maxWidth={800}
      maxHeight={800}
    >
      <div
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
        }}
        className="relative flex flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
      >
        <div
          ref={dragRef}
          onMouseDown={onMouseDown}
          className="flex cursor-move items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-white"
        >
          <h1 className="text-xl font-bold">Helicone Demos</h1>
          <button
            onClick={() => setOpenDemo(false)}
            className="text-white transition-colors hover:text-gray-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
          <StartPage />
        </div>
      </div>
    </Resizable>
  );
};
