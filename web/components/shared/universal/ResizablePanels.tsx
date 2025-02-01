import { useCallback, useState } from "react";

interface ResizablePanelsProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export default function ResizablePanels({
  leftPanel,
  rightPanel,
}: ResizablePanelsProps) {
  const [state, setState] = useState({
    isResizing: false,
    isHovering: false,
    rightPanelWidth: 50,
    initialX: 0,
    containerWidth: 0,
    initialPanelWidth: 0,
  });

  const handleResize = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!state.isResizing) return;

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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = e.currentTarget.closest(".resizable-container");
    if (!container) return;

    setState((prev) => ({
      ...prev,
      isResizing: true,
      initialX: e.clientX,
      containerWidth: container.getBoundingClientRect().width,
      initialPanelWidth: prev.rightPanelWidth,
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    setState((prev) => ({ ...prev, isResizing: false }));
  }, []);

  const resizeHandleClasses = `px-2 ${
    state.isResizing ? "cursor-col-resize" : "hover:cursor-col-resize"
  }`;
  const dividerClasses = `w-0.5 h-full rounded-full transition-colors ${
    state.isResizing || state.isHovering
      ? "bg-heliblue dark:bg-heliblue"
      : "bg-slate-200 dark:bg-slate-800"
  }`;

  return (
    <div
      className="resizable-container flex h-full w-full select-none gap-2"
      onMouseUp={handleMouseUp}
      onMouseLeave={() =>
        setState((prev) => ({ ...prev, isResizing: false, isHovering: false }))
      }
      onMouseMove={handleResize}
    >
      <div className="flex h-full flex-1 flex-col">{leftPanel}</div>

      <div
        className={resizeHandleClasses}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setState((prev) => ({ ...prev, isHovering: true }))}
        onMouseLeave={() =>
          setState((prev) => ({ ...prev, isHovering: false }))
        }
      >
        <div className={dividerClasses} />
      </div>

      <div className="h-full" style={{ width: `${state.rightPanelWidth}%` }}>
        {rightPanel}
      </div>
    </div>
  );
}
