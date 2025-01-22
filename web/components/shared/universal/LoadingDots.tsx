export default function LoadingDots() {
  return (
    <span className="animate-fadeIn inline-flex items-center gap-[6px] align-middle text-[8px] opacity-0">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="inline-block animate-bounce text-heliblue"
          style={{
            animationDelay: `${index * 0.2}s`,
            transformOrigin: "center center",
          }}
        >
          ●
        </span>
      ))}
    </span>
  );
}
