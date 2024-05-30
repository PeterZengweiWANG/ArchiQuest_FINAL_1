import React, { useState, useEffect, useCallback } from "react";
import { getGroqCompletion, generateImageFal, getGeminiVision } from "./ai";
import {
  generateArtCriticPrompt,
  generateArtCriticNamePrompt,
  generateArtCriticNationalityPrompt,
  generateSimplifiedCritiquePrompt,
} from "./prompts";
import styles from "./ArtCritic.module.css";
import Image from 'next/image';

type ArtCriticProps = {
  imageUrl: string;
};

export default function ArtCritic({ imageUrl }: ArtCriticProps) {
  const [artCriticImage, setArtCriticImage] = useState<string>("");
  const [artCriticName, setArtCriticName] = useState<string>("");
  const [artCriticNationality, setArtCriticNationality] = useState<string>("");
  const [simplifiedCritique, setSimplifiedCritique] = useState<string>("");

  useEffect(() => {
    generateArtCritic();
  }, []);

  const generateSimplifiedCritique = useCallback(async () => {
    if (imageUrl) {
      const simplifiedCritiquePrompt = `${generateSimplifiedCritiquePrompt} The art critic is ${artCriticNationality}. Limit the critique to around 70 words.`;
      const simplifiedCritique = await getGeminiVision(simplifiedCritiquePrompt, imageUrl);
      setSimplifiedCritique(simplifiedCritique);
    }
  }, [imageUrl, artCriticNationality]);

  useEffect(() => {
    generateSimplifiedCritique();
  }, [generateSimplifiedCritique]);

  const generateArtCritic = async () => {
    const artCriticNationality = await getGroqCompletion("", 10, generateArtCriticNationalityPrompt, 0.8, 0.9);
    setArtCriticNationality(artCriticNationality.trim());

    const artCriticName = await getGroqCompletion(artCriticNationality, 10, generateArtCriticNamePrompt, 0.8, 0.9);
    const trimmedArtCriticName = artCriticName.trim().replace(/^.*?\s/, '');
    setArtCriticName(trimmedArtCriticName);

    const artCriticDescription = `A portrait of ${trimmedArtCriticName}, a ${artCriticNationality} art critic, including their appearance, attire, and any distinguishing features.`;
    const artCriticImageUrl = await generateImageFal(artCriticDescription, "portrait_4_3");
    setArtCriticImage(artCriticImageUrl);
  };

  return (
    <div className={styles.artCriticContainer}>
      {artCriticImage && (
        <>
          <Image src={artCriticImage} alt="Art Critic" className={styles.artCriticImage} width={150} height={150} />
          <p className={styles.artCriticName}>{artCriticName}</p>
          <p className={styles.artCriticNationality}>{artCriticNationality}</p>
        </>
      )}
      {simplifiedCritique && <p className={styles.simplifiedCritique}>{simplifiedCritique}</p>}
    </div>
  );
}
