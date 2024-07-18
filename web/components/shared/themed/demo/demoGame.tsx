import { useState } from "react";
import StartPage from "./startPage";

import { useJawnClient } from "../../../../lib/clients/jawnHook";

export const DemoGame = ({
  setOpenDemo,
}: {
  setOpenDemo: (open: boolean) => void;
}) => {
  const [gameState, setGameState] = useState<"start" | "playing" | "finished">(
    "playing"
  );
  const jawn = useJawnClient();

  return (
    <div className="bg-gradient-to-bl from-indigo-200 to-indigo-300 flex flex-col items-center justify-center bg-white h-[80vh] w-[500px] rounded-lg ">
      {gameState === "start" ? (
        <StartPage
          setOpenDemo={setOpenDemo}
          onPlay={() => setGameState("playing")}
        />
      ) : (
        <div>
          Playing
          <button
            onClick={async () => {
              const x = await jawn.POST("/v1/demo/completion", {
                body: {
                  messages: [{ role: "user", content: "Hello" }],
                },
              });
            }}
          >
            Send
          </button>
        </div>
      )}
      <button
        className="absolute top-0 right-0 h-[30px] w-[30px] z-[100] bg-red-500 flex items-center justify-center rounded-lg text-white font-bold"
        onClick={() => setOpenDemo(false)}
      >
        x
      </button>
    </div>
  );
};
