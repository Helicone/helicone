import { useState } from "react";
import Lottie from "lottie-react";
import * as guesswho from "../../../../public/lottie/guesswho.json";
import * as notebook from "../../../../public/lottie/notebook.json";
import GuessWhoGame from "./guessWho";
import { CourseGenerator } from "./courseGenerator";

const DEMO_GAMES = [
  {
    id: "1",
    name: "Guess Who Game",
    type: "Game",
    animation: guesswho,
    component: GuessWhoGame,
  },
  {
    id: "2",
    name: "Course Generator",
    type: "Tool",
    animation: notebook,
    component: CourseGenerator,
  },
];

const StartPage = () => {
  const [currentDemo, setCurrentDemo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onPlay = (demoId: string) => {
    setIsLoading(true);
    setCurrentDemo(demoId);
    setTimeout(() => setIsLoading(false), 2000); // Simulating loading time
  };

  const onReset = () => {
    setCurrentDemo(null);
  };

  if (!currentDemo) {
    return (
      <div className="p-6">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Select a Demo</h2>
        <div className="space-y-4">
          {DEMO_GAMES.map((game) => (
            <div
              key={game.id}
              className="flex cursor-pointer items-center space-x-4 rounded-xl border border-gray-200 bg-white p-4 transition-all duration-300 hover:shadow-md"
              onClick={() => onPlay(game.id)}
            >
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                <Lottie
                  animationData={game.animation}
                  style={{ height: 50, width: 50 }}
                  loop={true}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {game.name}
                </h3>
                <p className="text-sm text-gray-500">{game.type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-50">
        <Lottie
          animationData={
            DEMO_GAMES.find((g) => g.id === currentDemo)?.animation
          }
          style={{ height: 200, width: 300 }}
          loop={true}
        />
        <p className="mt-4 text-lg font-medium text-gray-600">
          Loading {DEMO_GAMES.find((g) => g.id === currentDemo)?.name}...
        </p>
      </div>
    );
  }

  const GameComponent = DEMO_GAMES.find((g) => g.id === currentDemo)?.component;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between bg-indigo-500 px-4 py-3 text-white">
        <button
          className="text-sm text-white transition-colors hover:text-gray-200"
          onClick={onReset}
        >
          ← Back to Demos
        </button>
      </div>
      <div className="flex-grow overflow-hidden">
        {GameComponent && <GameComponent />}
      </div>
    </div>
  );
};

export default StartPage;
