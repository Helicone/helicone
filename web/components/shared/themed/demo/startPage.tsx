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
    <div className="flex flex-col items-center justify-center gap-5">
      <p className="text-2xl tracking-[10px]">Helicone Presents</p>
      <div className="tracking-[10px] flex flex-col items-center justify-center animate-popin">
        <p className="text-4xl">GUESS</p>
        <p className="text-4xl">THE STAR</p>
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
      <div className="text-center text-sm w-[300px] font-light text-gray-600">
        An LLM-based game that will send logs to your Helicone dashboard!
      </div>
      <button
        className="bg-indigo-500 text-white p-2 rounded-md"
        onClick={onPlay}
      >
        Play Game
      </button>
      <button onClick={() => setOpenDemo(false)}>Close</button>
    </div>
  );
};

export default StartPage;
