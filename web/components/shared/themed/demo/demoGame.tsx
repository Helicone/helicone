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
    <div className="border border-2 flex flex-col items-center justify-between bg-white h-[80vh] max-h-[80vh] w-[500px] rounded-lg relative overflow-hidden">
      {gameState === "start" && (
        <StartPage setOpenDemo={setOpenDemo} onPlay={onPlay} />
      )}
      {gameState !== "start" && (
        <Col className="w-full px-5 py-10 justify-between items-center h-full">
          <button
            className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer absolute top-4 left-4"
            onClick={onReset}
          >
            Reset
          </button>
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
              <h1 className="text-2xl font-bold">🎉 You won! 🎉</h1>
              <p className="text-sm">
                You found the character in{" "}
                {chatHistory.length - 2 > 1 ? `${chatHistory.length - 2}` : "1"}{" "}
                {chatHistory.length - 2 > 1 ? "messages" : "message"}!
              </p>
              <button
                className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors"
                onClick={() => onReset()}
              >
                Play again
              </button>
            </Col>
          )}
        </Col>
      )}

      <button
        className="absolute top-2 right-2 h-8 w-8 bg-red-500 flex items-center justify-center rounded-full text-white font-bold hover:bg-red-600 transition-colors"
        onClick={() => setOpenDemo(false)}
      >
        ×
      </button>
    </div>
  );
};
