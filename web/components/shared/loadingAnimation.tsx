import Lottie from "react-lottie";
import * as chicky from "../../public/lottie/Polite Chicky.json";
import * as hamster from "../../public/lottie/Aniki Hamster.json";
import * as plane from "../../public/lottie/Paper Airplane.json";
import * as dashboard from "../../public/lottie/DashboardAnimation.json";
import * as boxbee from "../../public/lottie/boxbee.json";
import { useEffect, useState } from "react";

type Animation =
  | typeof chicky
  | typeof hamster
  | typeof plane
  | typeof dashboard
  | typeof boxbee;

interface LoadingAnimationProps {
  title?: string;
  height?: number;
  width?: number;
  animation?: Animation;
}

const LoadingAnimation = (props: LoadingAnimationProps) => {
  const {
    title,
    animation: defaultAnimation,
    height = 300,
    width = 300,
  } = props;
  const [animation, setAnimation] = useState<Animation | undefined>(
    defaultAnimation
  );

  function randomIntFromInterval(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  useEffect(() => {
    if (animation !== undefined) return;
    const animationItems = [chicky, hamster, plane];
    const randomIndex = randomIntFromInterval(0, animationItems.length - 1);
    setAnimation(animationItems[randomIndex]);
  }, [animation]);

  return (
    <div className="flex flex-col items-center justify-center align-middle w-full space-y-4">
      <Lottie
        options={{
          loop: true,
          autoplay: true,
          animationData: animation,
          rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
          },
        }}
        height={height}
        width={width}
        isStopped={false}
        isPaused={false}
        style={{
          pointerEvents: "none",
          background: "transparent",
        }}
      />

      {title && <p className="font-medium text-lg">{title}</p>}
    </div>
  );
};

export default LoadingAnimation;
