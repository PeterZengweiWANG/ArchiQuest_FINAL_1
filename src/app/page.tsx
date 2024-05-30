"use client";

import StartingPage from "./StartingPage";
import Game from "./Game";
import { useState } from "react";
import styles from "./Game.module.css";

export default function Home() {
  const [gameMode, setGameMode] = useState<"single" | "double" | "playerVsAI" | null>(null);

  const startSinglePlayerGame = () => {
    setGameMode("single");
  };

  const startDoublePlayerGame = () => {
    setGameMode("double");
  };

  const startPlayerVsAIGame = () => {
    setGameMode("playerVsAI");
  };

  const handlePlayAgain = () => {
    setGameMode(null);
  };

  return (
    <main className={styles.container}>
      {!gameMode ? (
        <StartingPage
          startSinglePlayerGame={startSinglePlayerGame}
          startDoublePlayerGame={startDoublePlayerGame}
          startPlayerVsAIGame={startPlayerVsAIGame}
        />
      ) : (
        <Game onPlayAgain={handlePlayAgain} gameMode={gameMode} />
      )}
    </main>
  );
}