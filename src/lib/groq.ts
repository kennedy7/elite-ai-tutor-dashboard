import Groq from "groq-sdk";
import * as dotenv from "dotenv";
dotenv.config();


const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL || "llama-3.1-chat"; // try chat model
const defaultTemp = Number(process.env.GROQ_TEMP ?? 0.7);

if (!apiKey) {
  console.warn("Warning: GROQ_API_KEY not set. Groq calls will fail.");
}

const client = new Groq({
  apiKey,
  baseURL: process.env.GROQ_API_BASE,
});

function extractTextFromCompletion(completion: any): string {
  // Try many common locations where text may appear
  try {
    if (!completion) return "";
    // common chat field
    const c0 = completion.choices?.[0];
    if (c0?.message?.content) return c0.message.content;
    if (c0?.text) return c0.text;
    // some SDKs use output_text
    if (completion.output_text) return completion.output_text;
    // new response shape: output[0].content[0].text
    if (completion.output?.[0]?.content?.[0]?.text) {
      return completion.output[0].content[0].text;
    }
    // another possible path
    if (completion.choices?.[0]?.message?.parts?.[0]) {
      return completion.choices[0].message.parts[0];
    }
    // raw choices array with text field
    if (completion.choices?.[0]?.message) {
      const msg = completion.choices[0].message;
      // try JSON stringify fallback
      return String(msg);
    }
    // fallback: stringify everything for debugging
    return JSON.stringify(completion);
  } catch (err) {
    return "";
  }
}

export async function callGroq(prompt: string, opts?: { temperature?: number }) {
  if (!prompt || !prompt.trim()) {
    throw new Error("Prompt must be a non-empty string.");
  }

  const temperature = typeof opts?.temperature === "number" ? opts.temperature : defaultTemp;

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
     content:  `
You are a friendly, smart conversational AI.
- Maintain context across previous user messages and respond consistently.
- Connect ideas from earlier in the conversation.
- Ask follow-up questions when helpful.
- Keep responses clear, accurate, and concise unless the user requests more detail.
- Give examples when needed.
- If the user is unclear, politely ask for clarification.
  `,
    }, 
    {
      role: "user",
      content: prompt,
    },
  ];

  //Request a chat completion and log the raw response for debugging
  const completion = await client.chat.completions.create({
    model,
    messages,
    max_tokens: 512,
    temperature,
    top_p: 1,
    n: 1,
  });

  // IMPORTANT: print full object so we can inspect (in server logs or console)
  try {
    // Node/Cloud Functions: functions.logger.info(...) or console.log in local debug.
    // Use console.log here — Cloud Functions emulator will surface it.
    console.log("=== GROQ RAW COMPLETION ===");
    console.log(JSON.stringify(completion, null, 2));
    console.log("=== END GROQ RAW COMPLETION ===");
  } catch (err) {
    // ignore logging errors
  }

  const answer = extractTextFromCompletion(completion);
  return { answer: (answer || "").trim(), raw: completion };
}
