import Lottie from "react-lottie";
import * as Pacman from "../../../../public/lottie/Pacman.json";

const StartPage = ({
  setOpenDemo,
  onPlay,
}: {
  setOpenDemo: (open: boolean) => void;
  onPlay: () => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-semibold tracking-[10px]">
        Helicone Presents
      </h1>
      <div className="tracking-[10px] flex flex-col items-center justify-center animate-popin gap-2">
        <p className="text-5xl ">GUESS WHO</p>
      </div>
      <Lottie
        options={{
          loop: true,
          autoplay: true,
          animationData: Pacman,
          rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
          },
        }}
        height={200}
        width={300}
        isStopped={false}
        isPaused={false}
        isClickToPauseDisabled={true}
      />
      <p className="text-sm font-light text-gray-600 max-w-[300px]">
        An LLM-based game that will send logs to your Helicone dashboard!
      </p>
      <div className="flex flex-col gap-3 w-full">
        <button
          className="bg-indigo-500 text-white py-3 px-6 rounded-md hover:bg-indigo-600 transition-colors"
          onClick={onPlay}
        >
          Play Game
        </button>
        <button
          className="text-gray-600 hover:text-gray-800 transition-colors"
          onClick={() => setOpenDemo(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default StartPage;
