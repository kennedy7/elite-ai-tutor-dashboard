// src/pages/api/ai/ai-chat.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Groq from "groq-sdk";
import * as dotenv from "dotenv";
dotenv.config();

// Load env variables (Next.js automatically loads from .env.local)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";

// Initialize Groq SDK
const groqClient = new Groq({ apiKey: GROQ_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // Check API key
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY is not configured" });
  }

  const { prompt, context } = req.body || {};

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: context || "You are a helpful AI tutor. Be short, friendly, and clear.",
      },
      { role: "user", content: prompt },
    ];

    const completion = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      max_tokens: 512,
      temperature: 0.3,
    });

    const answer = completion?.choices?.[0]?.message?.content ?? "No response received.";

    res.status(200).json({
      success: true,
      reply: answer.trim(),
    });
  } catch (error: any) {
    console.error("AI Chat API Error:", error);
    res.status(500).json({ error: error.message ?? "Internal Server Error" });
  }
}
