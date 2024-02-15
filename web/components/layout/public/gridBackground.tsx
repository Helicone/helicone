// this component wraps page components and adds the grid background that fades out at the bottom
interface GridBackgroundProps {
  children: React.ReactNode;
}

const GridBackground = (props: GridBackgroundProps) => {
  const { children } = props;

  return (
    <div className="bg-gray-50">
      <div className="relative isolate">
        <svg
          className="absolute inset-0 -z-10 h-full w-full stroke-gray-200 [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="abc"
              width={25}
              height={25}
              x="50%"
              y={-1}
              patternUnits="userSpaceOnUse"
            >
              <path d="M25 200V.5M.5 .5H200" fill="none" />
            </pattern>
            <defs>
              <pattern
                id="123"
                width="12.5"
                height="12.5"
                patternUnits="userSpaceOnUse"
              >
                <path d="M12.5 0V12.5M0 12.5H12.5" fill="none" />
              </pattern>
            </defs>
          </defs>
          <rect width="100%" height="100%" strokeWidth={0} fill="url(#abc)" />
        </svg>
        {children}
      </div>
    </div>
  );
};

export default GridBackground;
