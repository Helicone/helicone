import StartPage from "./startPage";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { Col } from "../../../layout/common";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import * as Pacman from "../../../../public/lottie/Pacman.json";
import Lottie from "react-lottie";
import { start } from "repl";

const DEMO_GAMES = [
  {
    id: "1",
    name: "Guess Who Game",
    type: "Game",
    animation: Pacman,
    component: StartPage,
  },
  {
    id: "2",
    name: "Course Generator",
    type: "Tool",
    animation: Pacman,
    component: StartPage,
  },
  {
    id: "3",
    name: "Chat Support Bot",
    type: "Bot",
    animation: Pacman,
    component: StartPage,
  },
];

const FAMOUS_MOVIES = [
  {
    title: "The Dark Knight",
    leadCharacters: [
      "Batman / Bruce Wayne",
      "Robin",
      "Alfred",
      "Joker",
      "Rachel",
      "Harvey Dent",
    ],
  },

  {
    title: "Twilight",
    leadCharacters: [
      "Bella Swan",
      "Edward Cullen",
      "Jacob Black",
      "Rory Sullivan",
    ],
  },
  {
    title: "Pirates of the Caribbean",
    leadCharacters: [
      "Jack Sparrow",
      "Will Turner",
      "Davy Jones",
      "Elizabeth Swann",
    ],
  },
];

const calculateInitialPosition = () => {
  if (typeof window === "undefined") return { x: 20, y: 20 }; // Default for SSR
  const padding = 20; // Distance from the edges
  return {
    x: window.innerWidth - 500 - padding, // Assuming max width of 500px
    y: window.innerHeight - 600 - padding, // Assuming max height of 600px
  };
};

export interface ChatHistory {
  role: "user" | "assistant";
  content: string;
}

export const DemoGame = ({
  setOpenDemo,
}: {
  setOpenDemo: (open: boolean) => void;
}) => {
  const [currentDemo, setCurrentDemo] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [gameState, setGameState] = useLocalStorage<
    "start" | "playing" | "finished"
  >("gameState", "playing");
  const [gameSessionId, setGameSessionId] = useLocalStorage<string | null>(
    "gameSessionId",
    null
  );

  const [chatHistory, setChatHistory] = useLocalStorage<ChatHistory[]>(
    "chatHistory",
    [{ role: "assistant", content: "Hello, type a message to begin..." }]
  );
  const [selectedMovie, setSelectedMovie] = useLocalStorage<
    (typeof FAMOUS_MOVIES)[number]
  >("selectedMovie", FAMOUS_MOVIES[0]);
  const [selectedCharacter, setSelectedCharacter] = useLocalStorage<
    (typeof selectedMovie.leadCharacters)[number]
  >("selectedCharacter", selectedMovie.leadCharacters[0]);

  const onReset = () => {
    setCurrentDemo(null);
    setGameState("start");
    setChatHistory([
      { role: "assistant", content: "Hello, type a message to begin..." },
    ]);
    setGameSessionId(null);
  };

  // const onPlay = (demoId: string) => {
  //   if (demoId === "1") {
  //     // Guess Who Game
  //     const randomMovie =
  //       FAMOUS_MOVIES[Math.floor(Math.random() * FAMOUS_MOVIES.length)];
  //     setSelectedMovie(randomMovie);
  //     const randomCharacter =
  //       randomMovie.leadCharacters[
  //         Math.floor(Math.random() * randomMovie.leadCharacters.length)
  //       ];
  //     setSelectedCharacter(randomCharacter);
  //     setGameState("playing");
  //     setGameSessionId(crypto.randomUUID());
  //   } else {
  //     // Handle other demo options here
  //     console.log(`Starting demo: ${demoId}`);
  //     // For now, we'll just close the demo selector
  //     setOpenDemo(false);
  //   }
  // };

  const onPlay = (demoId: string) => {
    setIsLoading(true);
    setCurrentDemo(demoId);
    setTimeout(() => setIsLoading(false), 2000); // Simulating loading time
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (dragRef.current && dragRef.current.contains(e.target as Node)) {
      setIsDragging(true);
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition((prev) => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    setPosition(calculateInitialPosition());
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className="bg-white shadow-2xl rounded-lg overflow-hidden w-[360px]"
    >
      <div
        ref={dragRef}
        onMouseDown={onMouseDown}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4 flex justify-between items-center cursor-move"
      >
        <h1 className="text-xl font-bold">Helicone Demos</h1>
        <button
          onClick={() => setOpenDemo(false)}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      <div className="h-[600px] overflow-y-auto">
        <StartPage />
      </div>
    </div>
  );

  // return (
  //   <div
  //     style={{
  //       position: "fixed",
  //       left: `${position.x}px`,
  //       top: `${position.y}px`,
  //     }}
  //     className="bg-white shadow-2xl rounded-lg overflow-hidden w-[360px]"
  //   >
  //     <div
  //       ref={dragRef}
  //       onMouseDown={onMouseDown}
  //       className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4 flex justify-between items-center cursor-move"
  //     >
  //       <h1 className="text-xl font-bold">Helicone Demos</h1>
  //       <button
  //         onClick={() => setOpenDemo(false)}
  //         className="text-white hover:text-gray-200 transition-colors"
  //       >
  //         <XMarkIcon className="h-6 w-6" />
  //       </button>
  //     </div>
  //     <div className="h-[600px] overflow-y-auto">
  //       {!currentDemo ? (
  //         <div className="p-6">
  //           <h2 className="text-2xl font-bold mb-6 text-gray-800">
  //             Select a Demo
  //           </h2>
  //           <div className="space-y-4">
  //             {DEMO_GAMES.map((game) => (
  //               <div
  //                 key={game.id}
  //                 className="flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300 cursor-pointer"
  //                 onClick={() => onPlay(game.id)}
  //               >
  //                 <div className="w-16 h-16 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center">
  //                   <Lottie
  //                     options={{
  //                       loop: true,
  //                       autoplay: true,
  //                       animationData: game.animation,
  //                     }}
  //                     height={50}
  //                     width={50}
  //                   />
  //                 </div>
  //                 <div>
  //                   <h3 className="font-semibold text-lg text-gray-800">
  //                     {game.name}
  //                   </h3>
  //                   <p className="text-sm text-gray-500">{game.type}</p>
  //                 </div>
  //               </div>
  //             ))}
  //           </div>
  //         </div>
  //       ) : isLoading ? (
  //         <div className="flex flex-col items-center justify-center h-full bg-gray-50">
  //           <Lottie
  //             options={{
  //               loop: true,
  //               autoplay: true,
  //               animationData: Pacman,
  //             }}
  //             height={200}
  //             width={300}
  //           />
  //           <p className="mt-4 text-lg font-medium text-gray-600">
  //             Loading {DEMO_GAMES.find((g) => g.id === currentDemo)?.name}...
  //           </p>
  //         </div>
  //       ) : (
  //         <div className="h-full relative">
  //           <button
  //             className="absolute top-4 left-4 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors flex items-center"
  //             onClick={() => setCurrentDemo(null)}
  //           >
  //             <svg
  //               className="w-4 h-4 mr-1"
  //               fill="none"
  //               stroke="currentColor"
  //               viewBox="0 0 24 24"
  //               xmlns="http://www.w3.org/2000/svg"
  //             >
  //               <path
  //                 strokeLinecap="round"
  //                 strokeLinejoin="round"
  //                 strokeWidth={2}
  //                 d="M10 19l-7-7m0 0l7-7m-7 7h18"
  //               />
  //             </svg>
  //             Back to Demos
  //           </button>
  //           <div className="pt-14 px-6">
  //             {DEMO_GAMES.find((g) => g.id === currentDemo)?.component({
  //               onReset: () => setCurrentDemo(null),
  //               // Add other props as needed
  //             })}
  //           </div>
  //         </div>
  //       )}
  //     </div>
  //   </div>
  // );
};
