import { useEffect, useRef, useState } from "react";

// CustomScrollbar: This component wraps its children and hides the native scrollbar completely.
// It shows a custom overlay scrollbar (thumb) on hover without affecting layout.
export default function CustomScrollbar({
  children,
  className = "",
  style = {},
  withBorder = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  withBorder?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    scrollTop: 0,
    clientHeight: 0,
    scrollHeight: 0,
  });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      setScrollState({
        scrollTop: container.scrollTop,
        clientHeight: container.clientHeight,
        scrollHeight: container.scrollHeight,
      });
    };

    // Event listeners
    container.addEventListener("scroll", update);
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(container);

    // Initial update
    update();

    return () => {
      container.removeEventListener("scroll", update);
      resizeObserver.disconnect();
    };
  }, []);

  const { scrollTop, clientHeight, scrollHeight } = scrollState;
  const thumbHeight =
    scrollHeight > clientHeight + 1
      ? (clientHeight / scrollHeight) * (clientHeight / 2)
      : clientHeight;
  const thumbTop =
    scrollHeight > clientHeight + 1
      ? (scrollTop / (scrollHeight - clientHeight)) *
        (clientHeight - thumbHeight)
      : 0;

  return (
    <div
      className={`relative ${className}`}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        ref={containerRef}
        className="h-full w-full overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {/* Custom overlay scrollbar */}
      {scrollHeight > clientHeight + 1 && (
        <div className="absolute top-0 right-0 bottom-0 w-[8px] pointer-events-none z-10">
          <div
            className={`absolute right-0 transition-opacity duration-200 ${
              withBorder
                ? "bg-slate-200 dark:bg-slate-800 border-slate-100 dark:border-slate-900"
                : "bg-slate-200 dark:bg-slate-800"
            } ${hovered ? "opacity-100" : "opacity-0"} ${
              thumbTop === 0
                ? "rounded-r-xs rounded-bl-md border-l border-b"
                : thumbTop + thumbHeight >= clientHeight
                ? "rounded-r-xs rounded-tl-md border-l border-t"
                : "rounded-l-md rounded-r-xs border-l border-y"
            }`}
            style={{
              top: thumbTop,
              height: thumbHeight,
              width: "8px",
            }}
          />
        </div>
      )}
    </div>
  );
}
