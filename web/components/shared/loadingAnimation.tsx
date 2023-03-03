import Lottie from "react-lottie";
import * as chicky from "../../public/lottie/Polite Chicky.json";
import * as hamster from "../../public/lottie/Aniki Hamster.json";
import * as plane from "../../public/lottie/Paper Airplane.json";

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

  const randomInt = randomIntFromInterval(1, 3);

  const getLottieId = () => {
    switch (randomInt) {
      case 1:
        return chicky;
      case 2:
        return hamster;
      case 3:
        return plane;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center align-middle w-full space-y-4">
      <Lottie
        options={{
          loop: true,
          autoplay: true,
          animationData: getLottieId(),
          rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
          },
        }}
        height={300}
        width={300}
        isStopped={false}
        isPaused={false}
        style={{
          pointerEvents: "none",
          background: "transparent",
        }}
      />

      <p className="font-medium text-lg">{title}</p>
    </div>
  );
};

export default LoadingAnimation;
