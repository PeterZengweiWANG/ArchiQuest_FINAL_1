import React from "react";
import styles from "./EndOfGameSettlement.module.css";

type EndOfGameSettlementProps = {
  player1MoneyBalance: number;
  player2MoneyBalance: number;
  onRestartGame: () => void;
};

export default function EndOfGameSettlement({
  player1MoneyBalance,
  player2MoneyBalance,
  onRestartGame,
}: EndOfGameSettlementProps) {
  const determineWinner = () => {
    if (player1MoneyBalance > player2MoneyBalance) {
      return "Player 1";
    } else if (player2MoneyBalance > player1MoneyBalance) {
      return "Player 2";
    } else {
      return "It's a tie!";
    }
  };

  const winner = determineWinner();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>End of Game Settlement</h2>
      <div className={styles.moneyBalances}>
        <p className={styles.moneyBalance}>Player 1 Money Balance: ${player1MoneyBalance}</p>
        <p className={styles.moneyBalance}>Player 2 Money Balance: ${player2MoneyBalance}</p>
      </div>
      {winner !== "It's a tie!" ? (
        <p className={styles.winner}>
          Woo-Hoo, {winner} won the Art Sprint, Congratulations!
        </p>
      ) : (
        <p className={styles.winner}>It's a tie! Both players have the same money balance.</p>
      )}
      <button className={styles.restartButton} onClick={onRestartGame}>
        Restart Game
      </button>
    </div>
  );
}