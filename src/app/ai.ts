"use server";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const groq_key = process.env.GROQ;
const fal_key = process.env.FAL;

const groq = new Groq({
  apiKey: groq_key,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI ?? "");

export async function getGroqCompletion(
  userPrompt: string,
  max_tokens: number,
  systemPrompt: string = "",
  temperature: number = 0.7,
  top_p: number = 1
) {
  const messages = [{ role: "system", content: systemPrompt }];
  if (userPrompt.trim() !== "") {
    messages.push({ role: "user", content: userPrompt });
  }

  const completion = await groq.chat.completions.create({
    messages: messages,
    model: "mixtral-8x7b-32768",
    max_tokens: max_tokens,
    temperature: temperature,
    top_p: top_p,
  });
  return (
    completion.choices[0]?.message?.content || "Oops, something went wrong."
  );
}

export async function generateImageFal(prompt: string, image_size: string) {
  const response = await fetch(`https://fal.run/fal-ai/fast-turbo-diffusion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Key ${fal_key}`,
    },
    body: JSON.stringify({
      prompt: prompt,
      image_size: image_size,
    }),
  });

  const responseJSON = await response.json();

  return responseJSON?.images[0].url;
}

export async function getGeminiVision(prompt: string, base64Image: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
  const formatted = base64Image.split(",")[1];
  const image = {
    inlineData: {
      data: formatted,
      mimeType: "image/jpeg",
    },
  };
  const result = await model.generateContent([prompt, image]);
  return result.response.text();
}

export async function getGeminiText(prompt: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
  const result = await model.generateContent([prompt]);
  return result.response.text();
}