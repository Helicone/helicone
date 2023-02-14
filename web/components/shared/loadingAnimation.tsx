interface LoadingAnimationProps {
  title: string;
  height?: number;
  width?: number;
}

const LoadingAnimation = (props: LoadingAnimationProps) => {
  const { title, height = 300, width = 300 } = props;

  return (
    <div className="flex flex-col items-center justify-center align-middle w-full space-y-4">
      <iframe
        src="https://embed.lottiefiles.com/animation/9844"
        className="w-full h-full"
        style={{
          height: `${height}px`,
          width: `${width}px`,
          pointerEvents: "none",
        }}
      />
      <p className="font-medium text-lg">{title}</p>
    </div>
  );
};

export default LoadingAnimation;
