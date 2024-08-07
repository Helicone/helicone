import StartPage from "./startPage";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { Resizable } from "react-resizable";

const calculateInitialPosition = () => {
  if (typeof window === "undefined") return { x: 20, y: 20 }; // Default for SSR
  const padding = 20; // Distance from the edges
  return {
    x: window.innerWidth - 500 - padding, // Assuming max width of 500px
    y: window.innerHeight - 600 - padding, // Assuming max height of 600px
  };
};

export interface ChatHistory {
  role: "user" | "assistant";
  content: string;
}

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

  const onMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition((prev) => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    }
  };

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
  }, [isDragging]);

  useEffect(() => {
    setPosition(calculateInitialPosition());
  }, []);

  const onResize = (
    event: React.SyntheticEvent,
    { size }: { size: { width: number; height: number } }
  ) => {
    setSize({ width: size.width, height: size.height });
  };

  useEffect(() => {
    setPosition(calculateInitialPosition());
  }, []);

  return (
    <Resizable
      width={size.width}
      height={size.height}
      onResize={onResize}
      minConstraints={[300, 400]}
      maxConstraints={[800, 800]}
      handle={<div className="react-resizable-handle resize-handle" />}
    >
      <div
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
        }}
        className="bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col relative"
      >
        <div
          ref={dragRef}
          onMouseDown={onMouseDown}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4 flex justify-between items-center cursor-move"
        >
          <h1 className="text-xl font-bold">Helicone Demos</h1>
          <button
            onClick={() => setOpenDemo(false)}
            className="text-white hover:text-gray-200 transition-colors"
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
