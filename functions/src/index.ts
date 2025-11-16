import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Groq from "groq-sdk";

admin.initializeApp();

const GROQ_API_KEY = functions.config()?.groq?.key ?? process.env.GROQ_API_KEY;
const GROQ_MODEL = functions.config()?.groq?.model ?? process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";

if (!GROQ_API_KEY) {
  functions.logger.warn("GROQ_API_KEY is not set. Groq calls will fail.");
}

// Local type for Groq chat messages
type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

const groqClient = new Groq({ apiKey: GROQ_API_KEY });

export const aiChat = functions
  .runWith({ memory: "512MB", timeoutSeconds: 60 })
  .https.onCall(async (data, context) => {
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be signed in to call this function."
      );
    }

    const uid = context.auth.uid;
    const userEmail = context.auth.token?.email ?? "unknown";

    const prompt = typeof data?.prompt === "string" ? data.prompt.trim() : "";
    const systemContext = typeof data?.context === "string" ? data.context.trim() : "";

    if (!prompt) {
      throw new functions.https.HttpsError("invalid-argument", "Missing or empty `prompt`.");
    }

    try {
      functions.logger.info(`aiChat called by uid=${uid} email=${userEmail}`);

      // Build messages with local type
      const messages: GroqMessage[] = [
        {
          role: "system",
          content: systemContext || "You are a helpful AI tutor. Be concise and helpful.",
        },
        { role: "user", content: prompt },
      ];

      const completion = await groqClient.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        max_tokens: 512,
        temperature: 0.2,
        top_p: 1,
        n: 1,
      });

      const answer =
        completion?.choices?.[0]?.message?.content ??
        "";

      const reply = (answer || "").trim();

      return { reply };
    } catch (err: any) {
      functions.logger.error("aiChat error", err);
      throw new functions.https.HttpsError("internal", err?.message ?? "AI service error");
    }
  });
