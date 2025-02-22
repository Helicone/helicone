import { useCallback, useState } from "react";

interface ResizablePanelsProps {
  leftPanel: React.ReactNode;
  rightTopPanel: React.ReactNode;
  rightBottomPanel: React.ReactNode;
}

export default function ResizablePanels({
  leftPanel,
  rightTopPanel,
  rightBottomPanel,
}: ResizablePanelsProps) {
  const [state, setState] = useState({
    isResizingHorizontal: false,
    isResizingVertical: false,
    isHoveringHorizontal: false,
    isHoveringVertical: false,
    rightPanelWidth: 50,
    rightTopPanelHeight: 50,
    initialX: 0,
    initialY: 0,
    containerWidth: 0,
    containerHeight: 0,
    initialPanelWidth: 0,
    initialPanelHeight: 0,
  });

  const handleHorizontalResize = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!state.isResizingHorizontal) return;

      const deltaX = e.clientX - state.initialX;
      const deltaPercentage = (deltaX / state.containerWidth) * 100;
      const newWidth = Math.min(
        Math.max(state.initialPanelWidth - deltaPercentage, 20),
        80
      );

      setState((prev) => ({ ...prev, rightPanelWidth: newWidth }));
    },
    [state]
  );
  const handleVerticalResize = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!state.isResizingVertical) return;

      const deltaY = e.clientY - state.initialY;
      const deltaPercentage = (deltaY / state.containerHeight) * 100;
      const newHeight = Math.min(
        Math.max(state.initialPanelHeight + deltaPercentage, 20),
        80
      );

      setState((prev) => ({ ...prev, rightTopPanelHeight: newHeight }));
    },
    [state]
  );

  const handleHorizontalMouseDown = useCallback((e: React.MouseEvent) => {
    const container = e.currentTarget.closest(".resizable-container");
    if (!container) return;

    setState((prev) => ({
      ...prev,
      isResizingHorizontal: true,
      initialX: e.clientX,
      containerWidth: container.getBoundingClientRect().width,
      initialPanelWidth: prev.rightPanelWidth,
    }));
  }, []);
  const handleVerticalMouseDown = useCallback((e: React.MouseEvent) => {
    const container = e.currentTarget.closest(".right-panel-container");
    if (!container) return;

    setState((prev) => ({
      ...prev,
      isResizingVertical: true,
      initialY: e.clientY,
      containerHeight: container.getBoundingClientRect().height,
      initialPanelHeight: prev.rightTopPanelHeight,
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isResizingHorizontal: false,
      isResizingVertical: false,
    }));
  }, []);
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleHorizontalResize(e);
      handleVerticalResize(e);
    },
    [handleHorizontalResize, handleVerticalResize]
  );

  return (
    <div
      className="resizable-container flex w-full h-full select-none relative"
      onMouseUp={handleMouseUp}
      onMouseLeave={() =>
        setState((prev) => ({
          ...prev,
          isResizingHorizontal: false,
          isResizingVertical: false,
          isHoveringHorizontal: false,
          isHoveringVertical: false,
        }))
      }
      onMouseMove={handleMouseMove}
    >
      {/* Left Panel */}
      <div className="flex-1 h-full">{leftPanel}</div>

      {/* Horizontal Resize Handle */}
      <div
        className={`absolute inset-0 w-4 flex items-stretch justify-center -translate-x-1/2 z-20 ${
          state.isResizingHorizontal
            ? "cursor-col-resize"
            : "hover:cursor-col-resize"
        }`}
        style={{ left: `${100 - state.rightPanelWidth}%` }}
        onMouseDown={handleHorizontalMouseDown}
        onMouseEnter={() =>
          setState((prev) => ({ ...prev, isHoveringHorizontal: true }))
        }
        onMouseLeave={() =>
          setState((prev) => ({ ...prev, isHoveringHorizontal: false }))
        }
      >
        <div
          className={`w-0.5 self-stretch rounded-full transition-colors ${
            state.isResizingHorizontal || state.isHoveringHorizontal
              ? "bg-heliblue dark:bg-heliblue"
              : "bg-slate-200 dark:bg-slate-800"
          }`}
        />
      </div>

      {/* Right Panel Container */}
      <div
        className="right-panel-container relative flex flex-col h-full"
        style={{ width: `${state.rightPanelWidth}%` }}
      >
        {/* Right Top Panel */}
        <div style={{ height: `${state.rightTopPanelHeight}%` }}>
          {rightTopPanel}
        </div>

        {/* Vertical Resize Handle */}
        <div
          className={`absolute left-0 right-0 h-4 flex items-center justify-center -translate-y-1/2 ${
            state.isResizingVertical
              ? "cursor-row-resize"
              : "hover:cursor-row-resize"
          }`}
          style={{ top: `${state.rightTopPanelHeight}%` }}
          onMouseDown={handleVerticalMouseDown}
          onMouseEnter={() =>
            setState((prev) => ({ ...prev, isHoveringVertical: true }))
          }
          onMouseLeave={() =>
            setState((prev) => ({ ...prev, isHoveringVertical: false }))
          }
        >
          <div
            className={`h-1 w-full rounded-full transition-colors ${
              state.isResizingVertical || state.isHoveringVertical
                ? "bg-heliblue dark:bg-heliblue"
                : "bg-slate-200 dark:bg-slate-800"
            }`}
          />
        </div>

        {/* Right Bottom Panel */}
        <div
          className="relative"
          style={{ height: `${100 - state.rightTopPanelHeight}%` }}
        >
          {rightBottomPanel}
        </div>
      </div>
    </div>
  );
}
