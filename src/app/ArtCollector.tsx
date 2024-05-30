import React, { useState, useEffect } from "react";
import { getGroqCompletion, generateImageFal, getGeminiText } from "./ai";
import {
  generateArtCollectorPrompt,
  generateArtCollectorNamePrompt,
  generateArtCollectorNationalityPrompt,
} from "./prompts";
import styles from "./ArtCollector.module.css";

type ArtCollectorProps = {
  artworkValue: string;
  onAcceptOffer: (price: number) => void;
  onOfferCancelled: () => void; // Added this function for offer cancelled situation :)
};

export default function ArtCollector({ artworkValue, onAcceptOffer, onOfferCancelled }: ArtCollectorProps) {
  const [artCollectorImage, setArtCollectorImage] = useState<string>("");
  const [artCollectorName, setArtCollectorName] = useState<string>("");
  const [artCollectorNationality, setArtCollectorNationality] = useState<string>("");
  const [offerAccepted, setOfferAccepted] = useState<boolean>(false);
  const [offerCancelled, setOfferCancelled] = useState<boolean>(false);
  const [dealMessage, setDealMessage] = useState<string>("");
  const [negotiationPrices, setNegotiationPrices] = useState<{ price: number; accepted: boolean }[]>([]);
  const [negotiationCount, setNegotiationCount] = useState<number>(0);
  const [initialOfferMessage, setInitialOfferMessage] = useState<string>("");
  const [negotiationMessage, setNegotiationMessage] = useState<string>("");

  useEffect(() => {
    generateArtCollector();
  }, []);

  useEffect(() => {
    generateInitialOfferMessage();
  }, [artworkValue]);

  const generateArtCollector = async () => {
    const artCollectorNationality = await getGroqCompletion("", 10, generateArtCollectorNationalityPrompt, 0.8, 0.9);
    setArtCollectorNationality(artCollectorNationality.trim());

    const artCollectorName = await getGroqCompletion(artCollectorNationality, 10, generateArtCollectorNamePrompt, 0.8, 0.9);
    const trimmedArtCollectorName = artCollectorName.trim().replace(/^.*?\s/, '');
    setArtCollectorName(trimmedArtCollectorName);

    const artCollectorDescription = `A portrait of ${trimmedArtCollectorName}, a ${artCollectorNationality} art collector, including their appearance, attire, and any distinguishing features.`;
    const artCollectorImageUrl = await generateImageFal(artCollectorDescription, "portrait_4_3");
    setArtCollectorImage(artCollectorImageUrl);
  };

  const generateInitialOfferMessage = async () => {
    const initialPrice = parseInt(artworkValue.slice(1).replace(/,/g, ""));
    const prompt = `As an art collector, generate a sentence expressing your interest in purchasing the artwork and purpose the offer price of $${initialPrice.toLocaleString()}.`;
    const message = await getGeminiText(prompt);
    setInitialOfferMessage(message);
  };

  const handleAcceptOffer = async () => {
    if (!offerAccepted && !offerCancelled) {
      const latestOffer = negotiationPrices.length > 0 ? negotiationPrices[negotiationPrices.length - 1] : { price: parseInt(artworkValue.slice(1).replace(/,/g, "")), accepted: false };
      if (latestOffer.price > 0) {
        setOfferAccepted(true);
        onAcceptOffer(latestOffer.price);
        const prompt = `As an art collector, generate a simple sentence showing the success of the deal after purchasing the artwork for $${latestOffer.price.toLocaleString()}.`;
        const message = await getGeminiText(prompt);
        setDealMessage(message);
        setNegotiationPrices((prevPrices) => {
          const updatedPrices = [...prevPrices];
          if (updatedPrices.length === 0) {
            updatedPrices.push({ price: latestOffer.price, accepted: true });
          } else {
            updatedPrices[updatedPrices.length - 1].accepted = true;
          }
          return updatedPrices;
        });
      }
    }
  };

  const handleNegotiate = async () => {
    const latestPrice = negotiationPrices.length > 0 ? negotiationPrices[negotiationPrices.length - 1].price : parseInt(artworkValue.slice(1).replace(/,/g, ""));
    const cancelChance = Math.min(negotiationCount * 0.1, 0.9);
    const prompt = `As an art collector, generate a new offer price based on the previous artwork valuation of $${latestPrice.toLocaleString()}. The new offer can be:
    - Significantly higher (30-50% increase) (15% chance)
    - Moderately higher (10-30% increase) (30% chance)
    - The same (10% chance)
    - Moderately lower (10-30% decrease) (20% chance)
    - Significantly lower (30-50% decrease) (15% chance)
    - Cancelled if the negotiation fails (${cancelChance * 100}% chance, increasing with each negotiation)
    Use a random factor to decide the price change. Provide only the new offer price or "Offer Cancelled" if the negotiation fails. Ensure the new offer price is within a reasonable range (between $100 and $1,000,000).`;

    const newOffer = await getGeminiText(prompt);
    if (newOffer.toLowerCase() === "offer cancelled") {
      setNegotiationPrices((prevPrices) => [...prevPrices, { price: 0, accepted: false }]);
      setOfferCancelled(true);
      setNegotiationMessage("I've decided to cancel the offer. The negotiation has failed to reach a satisfactory agreement.");
      onOfferCancelled(); // Call the onOfferCancelled prop
    } else {
      const newPrice = parseInt(newOffer.replace(/[^0-9]/g, ""));
      if (newPrice >= 100 && newPrice <= 1000000) {
        setNegotiationPrices((prevPrices) => [...prevPrices, { price: newPrice, accepted: false }]);

        // Generate negotiation message after updating the offer price
        const negotiationPrompt = `As an art collector, now you are in the price negotiation of purchasing an artwork, generate a sentence simulating the consideration and expressing your latest offer price of $${newPrice.toLocaleString()}.`;
        const negotiationMessage = await getGeminiText(negotiationPrompt);
        setNegotiationMessage(negotiationMessage);
      }
    }
    setNegotiationCount((prevCount) => prevCount + 1);
  };

  return (
    <div className={styles.artCollectorContainer}>
      {artCollectorImage && (
        <>
          <img src={artCollectorImage} alt="Art Collector" className={styles.artCollectorImage} />
          <p className={styles.artCollectorName}>{artCollectorName}</p>
          <p className={styles.artCollectorNationality}>{artCollectorNationality}</p>
        </>
      )}
      <p className={styles.artworkValue}>
        Offer Price:{" "}
        {negotiationPrices.length > 0
          ? negotiationPrices[negotiationPrices.length - 1].price === 0
            ? "Offer Cancelled"
            : `$${negotiationPrices[negotiationPrices.length - 1].price.toLocaleString()}`
          : artworkValue}
      </p>
      {initialOfferMessage && <p className={styles.initialOfferMessage}>{initialOfferMessage}</p>}
      {negotiationMessage && <p className={styles.negotiationMessage}>{negotiationMessage}</p>}
      <div className={styles.offerButtons}>
        <button className={styles.offerButton} onClick={handleAcceptOffer} disabled={offerAccepted || offerCancelled}>
          {offerAccepted ? "Offer Accepted" : offerCancelled ? "Offer Cancelled" : "Accept Offer"}
        </button>
        <button className={styles.offerButton} onClick={handleNegotiate} disabled={offerAccepted || offerCancelled}>
          Negotiate
        </button>
      </div>
      {dealMessage && <p className={styles.dealMessage}>{dealMessage}</p>}
      <div className={styles.negotiationPrices}>
        <p className={styles.negotiationPricesTitle}>Negotiation Price Record:</p>
        {negotiationPrices.map((price, index) => (
          <p key={index} className={styles.negotiationPrice}>
            {price.price > 0 ? `$${price.price.toLocaleString()}` : "Offer Cancelled"}
            {price.accepted && " - Sold"}
          </p>
        ))}
      </div>
    </div>
  );
}
