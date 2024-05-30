import React, { useState, useEffect } from "react";
import { getGroqCompletion } from "./ai";
import styles from "./CharacterCreationPage.module.css";

type CharacterCreationPageProps = {
  onConfirm: (player1Name: string, player2Name: string, player1ArtStyle: string, player2ArtStyle: string) => void;
};

export default function CharacterCreationPage({ onConfirm }: CharacterCreationPageProps) {
  const [player1Name, setPlayer1Name] = useState<string>("");
  const [player2Name, setPlayer2Name] = useState<string>("");
  const [artStyles, setArtStyles] = useState<string[]>([]);
  const [player1ArtStyle, setPlayer1ArtStyle] = useState<string>("");
  const [player2ArtStyle, setPlayer2ArtStyle] = useState<string>("");

  useEffect(() => {
    generateArtStyles();
  }, []);

  const generateArtStyles = async () => {
    const prompt = "Generate a list of 15 diverse and representative key words for Art Style, provide only the Key words separated by commas, no other words needed. The key words should from Fine Art, Movie, Game, Animation, etc.. like Simpsons, Vincent van Gogh, Fast and Furious, Minecraft...";
    const generatedArtStyles = await getGroqCompletion("", 128, prompt, 0.8, 0.9);
    setArtStyles(generatedArtStyles.split(",").map((style) => style.trim()));
  };

  const handleConfirm = () => {
    onConfirm(player1Name, player2Name, player1ArtStyle, player2ArtStyle);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Character Creation</h2>
      <div className={styles.playerSetup}>
        <div className={styles.playerInput}>
          <label htmlFor="player1Name">Player 1 Name:</label>
          <input
            type="text"
            id="player1Name"
            value={player1Name}
            onChange={(e) => setPlayer1Name(e.target.value)}
          />
        </div>
        <div className={styles.playerInput}>
          <label htmlFor="player2Name">Player 2 Name:</label>
          <input
            type="text"
            id="player2Name"
            value={player2Name}
            onChange={(e) => setPlayer2Name(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.artStyleSelection}>
        <h3 className={styles.subtitle}>Art Style Selection</h3>
        <div className={styles.artStyleLists}>
          <div className={styles.artStyleList}>
            <h4 className={styles.playerName}>Player 1</h4>
            {artStyles.map((style, index) => (
              <button
                key={index}
                className={`${styles.artStyleButton} ${player1ArtStyle === style ? styles.selected : ""}`}
                onClick={() => setPlayer1ArtStyle(style)}
              >
                {style}
              </button>
            ))}
          </div>
          <div className={styles.artStyleList}>
            <h4 className={styles.playerName}>Player 2</h4>
            {artStyles.map((style, index) => (
              <button
                key={index}
                className={`${styles.artStyleButton} ${player2ArtStyle === style ? styles.selected : ""}`}
                onClick={() => setPlayer2ArtStyle(style)}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button className={styles.confirmButton} onClick={handleConfirm}>
        Confirm
      </button>
    </div>
  );
}