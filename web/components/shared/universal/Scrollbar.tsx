import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

// CustomScrollbar: This component wraps its children and hides the native scrollbar completely.
// It shows a custom overlay scrollbar (thumb) on hover without affecting layout.
export interface CustomScrollbarRef {
  scrollToBottom: () => void;
}

const CustomScrollbar = forwardRef<
  CustomScrollbarRef,
  {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    withBorder?: boolean;
  }
>(({ children, className = "", style = {}, withBorder = false }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    scrollTop: 0,
    clientHeight: 0,
    scrollHeight: 0,
  });
  const [hovered, setHovered] = useState(false);

  // Expose scrollToBottom method
  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      const container = containerRef.current;
      if (container) {
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      }
    },
  }));

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
        className="h-full w-full overflow-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {/* Custom overlay scrollbar */}
      {scrollHeight > clientHeight + 1 && (
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-50 w-[8px]">
          <div
            className={`absolute right-0 transition-opacity duration-200 ${
              withBorder
                ? "border-slate-100 bg-slate-200 dark:border-slate-900 dark:bg-slate-800"
                : "border-transparent bg-slate-200 dark:bg-slate-800"
            } ${hovered ? "opacity-100" : "opacity-0"} ${
              thumbTop === 0
                ? "rounded-r-xs rounded-bl-md border-b border-l"
                : thumbTop + thumbHeight >= clientHeight
                  ? "rounded-r-xs rounded-tl-md border-l border-t"
                  : "rounded-r-xs rounded-l-md border-y border-l"
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
});

CustomScrollbar.displayName = "CustomScrollbar";

export default CustomScrollbar;
