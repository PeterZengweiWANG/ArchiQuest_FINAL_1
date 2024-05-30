import { useState, useEffect, useRef, useCallback } from "react";
import { getGroqCompletion, generateImageFal, getGeminiVision, getGeminiText } from "./ai";
import {
  generateTitlePrompt,
  generateElementsPrompt,
  generateThemePrompt,
  generateArtCategoriesPrompt,
  generateImagePrompt,
  generateCritiquePrompt,
} from "./prompts";
import MusicPlayer from "./musicPlayer";
import styles from "./Game.module.css";
import AIPlayer from "./AIPlayer";
import ArtCritic from "./ArtCritic";
import ArtCollector from "./ArtCollector";
import EndOfGameSettlement from "./EndOfGameSettlement";
import CharacterCreationPage from "./CharacterCreationPage";
import Image from 'next/image';

export type SelectableButton = {
  text: string;
  selected: boolean;
};

type GameProps = {
  onPlayAgain: () => void;
  gameMode: "single" | "double" | "playerVsAI";
};

export default function Game({ onPlayAgain, gameMode }: GameProps) {
  const [title, setTitle] = useState<string>("");
  const [theme, setTheme] = useState<string>("");
  const [artCategoriesLeft, setArtCategoriesLeft] = useState<SelectableButton[]>([]);
  const [artCategoriesRight, setArtCategoriesRight] = useState<SelectableButton[]>([]);
  const [selectedArtCategoriesLeft, setSelectedArtCategoriesLeft] = useState<string[]>([]);
  const [selectedArtCategoriesRight, setSelectedArtCategoriesRight] = useState<string[]>([]);
  const [elementsLeft, setElementsLeft] = useState<SelectableButton[]>([]);
  const [elementsRight, setElementsRight] = useState<SelectableButton[]>([]);
  const [selectedElementsLeft, setSelectedElementsLeft] = useState<string[]>([]);
  const [selectedElementsRight, setSelectedElementsRight] = useState<string[]>([]);
  const [imgLeft, setImgLeft] = useState<string>("");
  const [imgRight, setImgRight] = useState<string>("");
  const [commentLeft, setCommentLeft] = useState<string>("");
  const [valueLeft, setValueLeft] = useState<string>("");
  const [commentRight, setCommentRight] = useState<string>("");
  const [valueRight, setValueRight] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(40);
  const [timeUp, setTimeUp] = useState<boolean>(false);
  const [currentPlayer, setCurrentPlayer] = useState<"left" | "right">("left");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingLeft, setIsGeneratingLeft] = useState(false);
  const [isGeneratingRight, setIsGeneratingRight] = useState(false);
  const [fullScreenImg, setFullScreenImg] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const musicPlayerRef = useRef<MusicPlayer | null>(null);
  const [playerCredit, setPlayerCredit] = useState<number>(0);
  const [player1Money, setPlayer1Money] = useState<number>(0);
  const [player2Money, setPlayer2Money] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [player1MoneyBalance, setPlayer1MoneyBalance] = useState<number>(0);
  const [player2MoneyBalance, setPlayer2MoneyBalance] = useState<number>(0);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [player1Name, setPlayer1Name] = useState<string>("");
  const [player2Name, setPlayer2Name] = useState<string>("");
  const [player1ArtStyle, setPlayer1ArtStyle] = useState<string>("");
  const [player2ArtStyle, setPlayer2ArtStyle] = useState<string>("");
  const [characterCreationDone, setCharacterCreationDone] = useState<boolean>(false);
  const [seeResultEnabled, setSeeResultEnabled] = useState<boolean>(false);
  const [offerAcceptedLeft, setOfferAcceptedLeft] = useState<boolean>(false);
  const [offerCancelledLeft, setOfferCancelledLeft] = useState<boolean>(false);
  const [offerAcceptedRight, setOfferAcceptedRight] = useState<boolean>(false);
  const [offerCancelledRight, setOfferCancelledRight] = useState<boolean>(false);

  useEffect(() => {
    const tracks = ["/Autumn Whispers.mp3", "/Cyber.mp3","/Melancholy Whisperings.mp3", "/Backdoor.mp3", "/Echoes20Freedom.mp3"];
    musicPlayerRef.current = new MusicPlayer(tracks);
  }, []);

  const generateThemeAndArtStyleAndCategories = useCallback(async () => {
    const [generatedTitle, generatedTheme, generatedArtCategories] = await Promise.all([
      getGroqCompletion("", 32, generateTitlePrompt, 0.8, 0.9),
      getGroqCompletion("", 32, generateThemePrompt, 0.8, 0.9),
      getGroqCompletion("", 128, generateArtCategoriesPrompt, 0.8, 0.9),
    ]);
    setTitle(generatedTitle.trim());
    setTheme(generatedTheme.trim());

    const artCategoryArray = generatedArtCategories.split(",");
    const artCategories = artCategoryArray.map((text: string) => ({
      text: text.trim(),
      selected: false,
    }));
    setArtCategoriesLeft(artCategories);
    setArtCategoriesRight(artCategories);
    setSelectedArtCategoriesLeft([]);
    setSelectedArtCategoriesRight([]);

    generateElements(generatedTitle);
  }, []);

  useEffect(() => {
    generateThemeAndArtStyleAndCategories();
  }, [generateThemeAndArtStyleAndCategories]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime > 0) {
          return prevTime - 1;
        } else {
          clearInterval(timer);
          return 0;
        }
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      if (currentPlayer === "left" && (selectedArtCategoriesLeft.length === 0 || selectedElementsLeft.length === 0)) {
        setTimeUp(true);
      } else if (currentPlayer === "right" && (selectedArtCategoriesRight.length === 0 || selectedElementsRight.length === 0)) {
        setTimeUp(true);
      }
    }
  }, [timeLeft, selectedArtCategoriesLeft, selectedArtCategoriesRight, selectedElementsLeft, selectedElementsRight, currentPlayer]);

  const generateImageRight = useCallback(async () => {
    setIsGeneratingRight(true);
    const imageDescription = await getGroqCompletion(
      `Describe an artwork in the style of ${player2ArtStyle} that belongs to the following categories: ${selectedArtCategoriesRight.join(
        ", "
      )} and includes: ${selectedElementsRight.join(", ")}`,
      256,
      generateImagePrompt,
      0.8,
      0.9
    );
    const imageUrl = await generateImageFal(imageDescription, "landscape_16_9");
    setImgRight(imageUrl);

    const critiquePrompt = "Briefly describe the artwork in approximately 200 words. Be opinionated about its merits or failings.";
    const critique = await getGeminiVision(critiquePrompt, imageUrl);
    setCommentRight(critique);

    const valuationPrompt = "As an experienced art appraiser, carefully analyze the provided image of the artwork. Consider factors such as the artists skill, the complexity of the composition, the uniqueness of the style, and the overall aesthetic appeal. Based on your analysis, provide a fair market valuation for this artwork in US dollars, ranging from a few hundred dollars to several thousand dollars. Respond with just a number, no other text.";
    const valuationResponse = await getGeminiVision(valuationPrompt, imageUrl);
    const valuationNumber = parseFloat(valuationResponse.trim());
    setValueRight(`$${valuationNumber.toLocaleString()}`);

    setIsGeneratingRight(false);
  }, [player2ArtStyle, selectedArtCategoriesRight, selectedElementsRight]);

  useEffect(() => {
    if (gameMode === "playerVsAI" && currentPlayer === "right" && !isGeneratingRight) {
      AIPlayer.playTurn(
        artCategoriesRight,
        elementsRight,
        theme,
        generateImageRight
      );
    }
  }, [gameMode, currentPlayer, isGeneratingRight, artCategoriesRight, elementsRight, theme, generateImageRight]);

  useEffect(() => {
    if (currentRound === 3 && (offerAcceptedLeft || offerCancelledLeft || offerAcceptedRight || offerCancelledRight)) {
      setSeeResultEnabled(true);
    }
  }, [currentRound, offerAcceptedLeft, offerCancelledLeft, offerAcceptedRight, offerCancelledRight]);

  const generateElements = async (title: string) => {
    const elementString = await getGroqCompletion(
      title,
      256,
      generateElementsPrompt,
      0.8,
      0.9
    );
    const elementArray = elementString.split(",");
    const elements = elementArray.map((text: string) => ({
      text: text.trim(),
      selected: false,
    }));

    setElementsLeft(elements);
    setElementsRight(elements);
    setSelectedElementsLeft([]);
    setSelectedElementsRight([]);
  };

  const handleSelectArtCategoryLeft = (index: number) => {
    const updatedArtCategories = artCategoriesLeft.map((category, i) => {
      if (i === index) {
        return { ...category, selected: !category.selected };
      }
      return category;
    });
    setArtCategoriesLeft(updatedArtCategories);
    setSelectedArtCategoriesLeft(
      updatedArtCategories
        .filter((category) => category.selected)
        .map((category) => category.text)
    );
  };

  const handleSelectArtCategoryRight = (index: number) => {
    const updatedArtCategories = artCategoriesRight.map((category, i) => {
      if (i === index) {
        return { ...category, selected: !category.selected };
      }
      return category;
    });
    setArtCategoriesRight(updatedArtCategories);
    setSelectedArtCategoriesRight(
      updatedArtCategories
        .filter((category) => category.selected)
        .map((category) => category.text)
    );
  };

  const handleSelectElementLeft = (index: number) => {
    if (selectedElementsLeft.length < 5) {
      const updatedElements = elementsLeft.map((element, i) => {
        if (i === index) {
          return { ...element, selected: !element.selected };
        }
        return element;
      });
      setElementsLeft(updatedElements);
      setSelectedElementsLeft(
        updatedElements
          .filter((element) => element.selected)
          .map((element) => element.text)
      );
    }
  };

  const handleSelectElementRight = (index: number) => {
    if (selectedElementsRight.length < 5) {
      const updatedElements = elementsRight.map((element, i) => {
        if (i === index) {
          return { ...element, selected: !element.selected };
        }
        return element;
      });
      setElementsRight(updatedElements);
      setSelectedElementsRight(
        updatedElements
          .filter((element) => element.selected)
          .map((element) => element.text)
      );
    }
  };

  const generateImageLeft = async () => {
    setIsGeneratingLeft(true);
    const imageDescription = await getGroqCompletion(
      `Describe an artwork in the style of ${player1ArtStyle} that belongs to the following categories: ${selectedArtCategoriesLeft.join(
        ", "
      )} and includes: ${selectedElementsLeft.join(", ")}`,
      256,
      generateImagePrompt,
      0.8,
      0.9
    );
    const imageUrl = await generateImageFal(imageDescription, "landscape_16_9");
    setImgLeft(imageUrl);

    const critiquePrompt = "Briefly describe the artwork in approximately 200 words. Be opinionated about its merits or failings.";
    const critique = await getGeminiVision(critiquePrompt, imageUrl);
    setCommentLeft(critique);

    const valuationPrompt = "As an experienced art appraiser, carefully analyze the provided image of the artwork. Consider factors such as the artists skill, the complexity of the composition, the uniqueness of the style, and the overall aesthetic appeal. Based on your analysis, provide a fair market valuation for this artwork in US dollars, ranging from a few hundred dollars to several thousand dollars. Respond with just a number, no other text.";
    const valuationResponse = await getGeminiVision(valuationPrompt, imageUrl);
    const valuationNumber = parseFloat(valuationResponse.trim());
    setValueLeft(`$${valuationNumber.toLocaleString()}`);

    setCurrentPlayer("right");
    setTimeLeft(40);
    setIsGeneratingLeft(false);
  };

  const playAgain = () => {
    onPlayAgain();
  };

  const restartGame = () => {
    onPlayAgain();
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      musicPlayerRef.current?.pause();
    } else {
      musicPlayerRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    musicPlayerRef.current?.nextTrack();
  };

  const previousTrack = () => {
    musicPlayerRef.current?.previousTrack();
  };

  const handleAcceptOffer = (playerId: string, price: number) => {
    if (playerId === "left") {
      setPlayer1MoneyBalance((prevBalance) => prevBalance + price);
      setOfferAcceptedLeft(true);
    } else if (playerId === "right") {
      setPlayer2MoneyBalance((prevBalance) => prevBalance + price);
      setOfferAcceptedRight(true);
    }
  };

  const handleOfferCancelled = (playerId: string) => {
    if (playerId === "left") {
      setOfferCancelledLeft(true);
    } else if (playerId === "right") {
      setOfferCancelledRight(true);
    }
  };

  const openFullScreen = (imgUrl: string) => {
    setFullScreenImg(imgUrl);
  };

  const closeFullScreen = () => {
    setFullScreenImg("");
    setZoomLevel(1);
  };

  const zoomIn = () => {
    setZoomLevel((prevZoom) => prevZoom * 1.2);
  };

  const zoomOut = () => {
    setZoomLevel((prevZoom) => prevZoom / 1.2);
  };

  const handleNextRound = () => {
    if (currentRound === 3) {
      setSeeResultEnabled(true);
    } else {
      setCurrentRound((prevRound) => prevRound + 1);
      setTitle("");
      setTheme("");
      setArtCategoriesLeft([]);
      setArtCategoriesRight([]);
      setSelectedArtCategoriesLeft([]);
      setSelectedArtCategoriesRight([]);
      setElementsLeft([]);
      setElementsRight([]);
      setSelectedElementsLeft([]);
      setSelectedElementsRight([]);
      setImgLeft("");
      setImgRight("");
      setCommentLeft("");
      setValueLeft("");
      setCommentRight("");
      setValueRight("");
      setTimeLeft(40);
      setTimeUp(false);
      setCurrentPlayer("left");
      setIsGeneratingLeft(false);
      setIsGeneratingRight(false);
      generateThemeAndArtStyleAndCategories();
    }
  };

  const handleSeeResult = () => {
    setGameEnded(true);
  };

  const handleCharacterCreationConfirm = (
    player1Name: string,
    player2Name: string,
    player1ArtStyle: string,
    player2ArtStyle: string
  ) => {
    setPlayer1Name(player1Name);
    setPlayer2Name(player2Name);
    setPlayer1ArtStyle(player1ArtStyle);
    setPlayer2ArtStyle(player2ArtStyle);
    setCharacterCreationDone(true);
  };

  return (
    <div className={styles.newpage}>
      {!characterCreationDone ? (
        <CharacterCreationPage onConfirm={handleCharacterCreationConfirm} />
      ) : (
        <>
          <h2 className={styles.title}>Title: {title}</h2>
          <h3 className={styles.subtitle}>Theme: {theme}</h3>
          <p className={styles.timer}>Time Left: {timeLeft} seconds</p>

          {gameEnded ? (
            <EndOfGameSettlement
              player1MoneyBalance={player1MoneyBalance}
              player2MoneyBalance={player2MoneyBalance}
              onRestartGame={restartGame}
            />
          ) : (
            <>
              <div className={styles.playersContainer}>
                <div className={styles.playerBox}>
                  <div className={styles.playerHeader}>
                    <h4 className={styles.playerName}>{player1Name}</h4>
                    <p className={styles.playerArtStyle}>Art Style: {player1ArtStyle}</p>
                    <p className={styles.playerMoney}>Money: ${player1MoneyBalance}</p>
                  </div>
                  <div className={styles.elementContainer}>
                    <h4 className={styles.elementTitle}>Elements</h4>
                    <div className={styles.elementGrid}>
                      {elementsLeft.map((element, index) => (
                        <button
                          key={index}
                          className={`${styles.elementButton} ${
                            element.selected ? styles.elementButtonSelected : styles.elementButtonUnselected
                          }`}
                          onClick={() => handleSelectElementLeft(index)}
                          disabled={currentPlayer !== "left"}
                        >
                          {element.text}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.artCategoryContainer}>
                    <h4 className={styles.artCategoryTitle}>Art Categories</h4>
                    <div className={styles.artCategoryGrid}>
                      {artCategoriesLeft.map((category, index) => (
                        <button
                          key={index}
                          className={`${styles.artCategoryButton} ${
                            category.selected ? styles.artCategoryButtonSelected : styles.artCategoryButtonUnselected
                          }`}
                          onClick={() => handleSelectArtCategoryLeft(index)}
                          disabled={currentPlayer !== "left"}
                        >
                          {category.text}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.playerBoxContent}>
                    <div className={styles.generateButtonContainer}>
                      <button
                        className={styles.generateButton}
                        onClick={generateImageLeft}
                        disabled={selectedArtCategoriesLeft.length === 0 || selectedElementsLeft.length < 5 || currentPlayer !== "left" || isGeneratingLeft}
                      >
                        {isGeneratingLeft ? "Generating artwork..." : "Generate Image"}
                      </button>
                    </div>
                    {imgLeft && (
                      <div>
                        <Image src={imgLeft} alt="Generated Artwork" className={styles.resultImage} width={500} height={300} onClick={() => openFullScreen(imgLeft)} />
                        <ArtCritic imageUrl={imgLeft} />
                        <ArtCollector
                          artworkValue={valueLeft}
                          onAcceptOffer={(price) => handleAcceptOffer("left", price)}
                          onOfferCancelled={() => handleOfferCancelled("left")}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.playerBox}>
                  <div className={styles.playerHeader}>
                    <h4 className={styles.playerName}>{player2Name}</h4>
                    <p className={styles.playerArtStyle}>Art Style: {player2ArtStyle}</p>
                    <p className={styles.playerMoney}>Money: ${player2MoneyBalance}</p>
                  </div>
                  <div className={styles.elementContainer}>
                    <h4 className={styles.elementTitle}>Elements</h4>
                    <div className={styles.elementGrid}>
                      {elementsRight.map((element, index) => (
                        <button
                          key={index}
                          className={`${styles.elementButton} ${
                            element.selected ? styles.elementButtonSelected : styles.elementButtonUnselected
                          }`}
                          onClick={() => handleSelectElementRight(index)}
                          disabled={currentPlayer !== "right"}
                        >
                          {element.text}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.artCategoryContainer}>
                    <h4 className={styles.artCategoryTitle}>Art Categories</h4>
                    <div className={styles.artCategoryGrid}>
                      {artCategoriesRight.map((category, index) => (
                        <button
                          key={index}
                          className={`${styles.artCategoryButton} ${
                            category.selected ? styles.artCategoryButtonSelected : styles.artCategoryButtonUnselected
                          }`}
                          onClick={() => handleSelectArtCategoryRight(index)}
                          disabled={currentPlayer !== "right"}
                        >
                          {category.text}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.playerBoxContent}>
                    <div className={styles.generateButtonContainer}>
                      <button
                        className={styles.generateButton}
                        onClick={generateImageRight}
                        disabled={selectedArtCategoriesRight.length === 0 || selectedElementsRight.length < 5 || currentPlayer !== "right" || isGeneratingRight}
                      >
                        {isGeneratingRight ? "Generating artwork..." : "Generate Image"}
                      </button>
                    </div>
                    {imgRight && (
                      <div>
                        <Image src={imgRight} alt="Generated Artwork" className={styles.resultImage} width={500} height={300} onClick={() => openFullScreen(imgRight)} />
                        <ArtCritic imageUrl={imgRight} />
                        <ArtCollector
                          artworkValue={valueRight}
                          onAcceptOffer={(price) => handleAcceptOffer("right", price)}
                          onOfferCancelled={() => handleOfferCancelled("right")}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.gameplayRoundContainer}>
                <p className={styles.gameplayRound}>Gameplay Round: {currentRound} of 3</p>
                {currentRound < 3 && (
                  <button
                    className={styles.nextRoundButton}
                    onClick={handleNextRound}
                    disabled={!imgLeft || !imgRight || isGeneratingLeft || isGeneratingRight}
                  >
                    Go Next Round
                  </button>
                )}
                <button
                  className={styles.seeResultButton}
                  onClick={handleSeeResult}
                  disabled={!seeResultEnabled}
                >
                  See Result
                </button>
              </div>
              <div className={styles.generateButtonContainer}>
                <button
                  className={styles.generateButton}
                  onClick={playAgain}
                  disabled={!imgLeft || !imgRight || isGeneratingLeft || isGeneratingRight}
                >
                  Play Again
                </button>
              </div>
              {timeUp && (
                <div>
                  <p className={styles.timeUpMessage}>Time's up! You didn't select any art categories or elements.</p>
                  <button className={styles.playAgainButton} onClick={restartGame}>
                    Start New Round
                  </button>
                </div>
              )}
              <div className={styles.musicPlayer}>
                <button
                  className={styles.musicPlayerButton}
                  onClick={previousTrack}
                >
                  Previous
                </button>
                <button
                  className={styles.musicPlayerButton}
                  onClick={togglePlayPause}
                >
                  {isPlaying ? "Pause" : "Play"}
                </button>
                <button
                  className={styles.musicPlayerButton}
                  onClick={nextTrack}
                >
                  Next
                </button>
              </div>

              {fullScreenImg && (
                <div className={styles.fullScreenPreview}>
                  <Image src={fullScreenImg} alt="Full Screen Artwork" className={styles.fullScreenImage} width={1200} height={800} style={{ transform: `scale(${zoomLevel})` }} />
                  <button className={styles.closeButton} onClick={closeFullScreen}>Close</button>
                  <div style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "10px" }}>
                    <button className={styles.musicPlayerButton} onClick={zoomIn}>Zoom In</button>
                    <button className={styles.musicPlayerButton} onClick={zoomOut}>Zoom Out</button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

