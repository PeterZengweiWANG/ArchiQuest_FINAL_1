import React from "react";
import styles from "./StartingPage.module.css";

type StartingPageProps = {
  startSinglePlayerGame: () => void;
  startDoublePlayerGame: () => void;
  startPlayerVsAIGame: () => void;
};

export default function StartingPage({ startSinglePlayerGame, startDoublePlayerGame, startPlayerVsAIGame }: StartingPageProps) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Art Sprint</h1>
      <div className={styles.buttonContainer}>
        <button
          className={styles.button}
          onClick={startSinglePlayerGame}
        >
          Single Player
        </button>
        <button
          className={styles.button}
          onClick={startDoublePlayerGame}
        >
          Double Player
        </button>
        <button
          className={styles.button}
          onClick={startPlayerVsAIGame}
        >
          Player vs AI
        </button>
      </div>
    </div>
  );
}