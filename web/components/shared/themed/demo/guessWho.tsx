import { useState, useEffect } from "react";
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

const GuessWhoGame = () => {
  const [gameState, setGameState] = useState<"playing" | "finished">("playing");
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm thinking of a character from a famous movie. Can you guess who it is? Ask me questions about the character or the movie to narrow it down!",
    },
  ]);
  const [selectedMovie, setSelectedMovie] = useState<
    (typeof FAMOUS_MOVIES)[number] | null
  >(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(
    null
  );

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const randomMovie =
      FAMOUS_MOVIES[Math.floor(Math.random() * FAMOUS_MOVIES.length)];
    const randomCharacter =
      randomMovie.leadCharacters[
        Math.floor(Math.random() * randomMovie.leadCharacters.length)
      ];
    setSelectedMovie(randomMovie);
    setSelectedCharacter(randomCharacter);
    setGameState("playing");
    setGameSessionId(crypto.randomUUID());
    setChatHistory([
      {
        role: "assistant",
        content:
          "Hello! I'm thinking of a character from a famous movie. Can you guess who it is? Ask me questions about the character or the movie to narrow it down!",
      },
    ]);
  };

  const handleFinish = () => {
    setGameState("finished");
  };

  return (
    <div className="flex flex-col h-full w-full">
      {gameState === "playing" && selectedMovie && selectedCharacter && (
        <div className="h-full">
          <ChatWindow
            onFinish={handleFinish}
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
        <div className="h-full flex flex-col items-center justify-center gap-5 p-6 text-center">
          <h1 className="text-2xl font-bold text-indigo-600">🎉 You won! 🎉</h1>
          <p className="text-md">
            You found the character in{" "}
            {chatHistory.length - 2 > 1 ? `${chatHistory.length - 2}` : "1"}{" "}
            {chatHistory.length - 2 > 1 ? "messages" : "message"}!
          </p>
          <p className="text-sm">
            The character was{" "}
            <span className="font-semibold">{selectedCharacter}</span> from the
            movie <span className="font-semibold">{selectedMovie?.title}</span>.
          </p>
          <button
            className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors text-sm mt-4"
            onClick={startNewGame}
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
};

export default GuessWhoGame;
