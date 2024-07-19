import StartPage from "./startPage";

import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { Col } from "../../../layout/common";
import { ChatWindow } from "./chatWindow";

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

export interface ChatHistory {
  role: "user" | "assistant";
  content: string;
}

export const DemoGame = ({
  setOpenDemo,
}: {
  setOpenDemo: (open: boolean) => void;
}) => {
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
    setGameState("start");
    setChatHistory([
      { role: "assistant", content: "Hello, type a message to begin..." },
    ]);
    setGameSessionId(null);
  };

  const onPlay = () => {
    const randomMovie =
      FAMOUS_MOVIES[Math.floor(Math.random() * FAMOUS_MOVIES.length)];
    setSelectedMovie(randomMovie);
    const randomCharacter =
      randomMovie.leadCharacters[
        Math.floor(Math.random() * randomMovie.leadCharacters.length)
      ];
    setSelectedCharacter(randomCharacter);
    setGameState("playing");
    setGameSessionId(crypto.randomUUID());
  };

  return (
    <div className="bg-gradient-to-bl from-indigo-200 to-indigo-300 flex flex-col items-center justify-center bg-white h-[80vh] max-h-[80vh] w-[500px] rounded-lg ">
      {gameState === "start" && (
        <StartPage setOpenDemo={setOpenDemo} onPlay={onPlay} />
      )}
      {gameState !== "start" && (
        <Col className="w-full p px-5 py-10 justify-between items-center h-full">
          <i
            className="text-sm text-gray-500 underline hover:text-gray-700 cursor-pointer"
            onClick={onReset}
          >
            reset
          </i>
          {gameState === "playing" && (
            <div className="h-full w-full">
              <ChatWindow
                onFinish={() => setGameState("finished")}
                chatHistory={chatHistory}
                setChatHistory={setChatHistory}
                movieTitle={selectedMovie.title}
                isLoading={false}
                movieCharacter={selectedCharacter}
                gameSessionId={gameSessionId}
              />
            </div>
          )}
          {gameState === "finished" && (
            <Col className="h-full flex items-center justify-center gap-5">
              <h1 className="text-2xl">🎉 You won! 🎉</h1>
              <p className="text-sm">
                You found the character in{" "}
                {chatHistory.length - 2 > 1 ? `${chatHistory.length - 2}` : ""}{" "}
                messages!
              </p>
              <button
                className="bg-indigo-500 text-white px-2 py-1 rounded-md"
                onClick={() => onReset()}
              >
                Play again
              </button>
            </Col>
          )}
        </Col>
      )}

      <button
        className="absolute top-0 right-0 h-[30px] w-[30px]  bg-red-500 flex items-center justify-center rounded-lg text-white font-bold"
        onClick={() => setOpenDemo(false)}
      >
        x
      </button>
    </div>
  );
};
