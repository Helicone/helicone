interface LoadingAnimationProps {
  title: string;
  height?: number;
  width?: number;
}

const LoadingAnimation = (props: LoadingAnimationProps) => {
  const { title, height = 300, width = 300 } = props;

  function randomIntFromInterval(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  const randomInt = randomIntFromInterval(1, 5);

  const getLottieId = () => {
    switch (randomInt) {
      case 1:
        return "9844";
      case 2:
        return "629";
      case 3:
        return "99274";
      case 4:
        return "28444";
      case 5:
        return "14592";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center align-middle w-full space-y-4">
      <iframe
        src={`https://embed.lottiefiles.com/animation/${getLottieId()}`}
        className="w-full h-full bg-gray-100"
        style={{
          height: `${height}px`,
          width: `${width}px`,
          pointerEvents: "none",
          background: "transparent",
        }}
      />

      <p className="font-medium text-lg">{title}</p>
    </div>
  );
};

export default LoadingAnimation;
