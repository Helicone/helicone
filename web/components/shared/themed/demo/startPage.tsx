import React, { useState } from "react";
import Lottie from "react-lottie";
import * as Pacman from "../../../../public/lottie/Pacman.json";
import GuessWhoGame from "./guessWho";

const CourseGenerator = ({ onReset }) => {
  // Implement the Course Generator logic here
  return (
    <div>
      <h2>Course Generator</h2>
      {/* Add your course generator components */}
    </div>
  );
};

const ChatSupportBot = ({ onReset }) => {
  // Implement the Chat Support Bot logic here
  return (
    <div>
      <h2>Chat Support Bot</h2>
      {/* Add your chat support bot components */}
    </div>
  );
};

const DEMO_GAMES = [
  {
    id: "1",
    name: "Guess Who Game",
    type: "Game",
    animation: Pacman,
    component: GuessWhoGame,
  },
  {
    id: "2",
    name: "Course Generator",
    type: "Tool",
    animation: Pacman,
    component: CourseGenerator,
  },
  {
    id: "3",
    name: "Chat Support Bot",
    type: "Bot",
    animation: Pacman,
    component: ChatSupportBot,
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
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Select a Demo</h2>
        <div className="space-y-4">
          {DEMO_GAMES.map((game) => (
            <div
              key={game.id}
              className="flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => onPlay(game.id)}
            >
              <div className="w-16 h-16 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center">
                <Lottie
                  options={{
                    loop: true,
                    autoplay: true,
                    animationData: game.animation,
                  }}
                  height={50}
                  width={50}
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
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
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <Lottie
          options={{
            loop: true,
            autoplay: true,
            animationData: DEMO_GAMES.find((g) => g.id === currentDemo)
              ?.animation,
          }}
          height={200}
          width={300}
          isStopped={false}
          isPaused={false}
          isClickToPauseDisabled={true}
        />
        <p className="mt-4 text-lg font-medium text-gray-600">
          Loading {DEMO_GAMES.find((g) => g.id === currentDemo)?.name}...
        </p>
      </div>
    );
  }

  const GameComponent = DEMO_GAMES.find((g) => g.id === currentDemo)?.component;

  return (
    <div className="h-full flex flex-col">
      <div className="bg-indigo-500 text-white px-4 py-3 flex justify-between items-center">
        <button
          className="text-sm text-white hover:text-gray-200 transition-colors"
          onClick={onReset}
        >
          ← Back to Demos
        </button>
        <button
          className="text-sm text-white hover:text-gray-200 transition-colors"
          onClick={onReset}
        >
          Exit Game
        </button>
      </div>
      <div className="flex-grow overflow-hidden">
        {GameComponent && <GameComponent onReset={onReset} />}
      </div>
    </div>
  );
};

export default StartPage;
