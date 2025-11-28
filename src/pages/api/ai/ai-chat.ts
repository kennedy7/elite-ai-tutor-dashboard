// src/pages/api/ai/aichat.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";

const groqClient = new Groq({
  apiKey: GROQ_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed. Use POST.",
    });
  }

  // Ensure API key exists
  if (!GROQ_API_KEY) {
    return res.status(500).json({
      error: "GROQ_API_KEY is missing in environment variables.",
    });
  }

  try {
    const { prompt, context } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Prompt is required and must be a string.",
      });
    }

    // Construct chat messages
    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: context || "You are a helpful AI tutor. Keep responses short, friendly, and clear.",
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    // Call Groq API
    const response = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      max_tokens: 512,
      temperature: 0.25,
    });

    const answer = response?.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({
      success: true,
      reply: answer ?? "No response from AI model.",
    });
  } catch (error: any) {
    console.error("AI Chat API Error:", error);

    return res.status(500).json({
      error: error?.message ?? "Internal server error.",
    });
  }
}
