import 'dotenv/config';
import * as admin from 'firebase-admin';
import { onCall, CallableRequest } from 'firebase-functions/v2/https';
import Groq from 'groq-sdk';
import * as logger from 'firebase-functions/logger';

admin.initializeApp();

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? '';
const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';

if (!GROQ_API_KEY) {
  logger.warn('GROQ_API_KEY is not set. Groq calls will fail.');
}

const groqClient = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

// Payload type
interface AIChatData {
  prompt?: string;
  context?: string;
}

export const aiChat = onCall(
  { memory: '512MiB', timeoutSeconds: 60 },
  async (request: CallableRequest<AIChatData>) => {
    const { data, auth } = request; // ✅ v2: auth replaces context.auth

    if (!auth) {
      throw new Error('unauthenticated: You must be signed in to call this function.');
    }

    const uid = auth.uid;
    const userEmail = auth.token?.email ?? 'unknown';

    const prompt = data?.prompt?.trim() ?? '';
    const systemContext = data?.context?.trim() ?? '';

    if (!prompt) {
      throw new Error('invalid-argument: Missing or empty `prompt`.');
    }

    if (!groqClient) {
      logger.warn('Groq client not initialized. Returning empty reply.');
      return { reply: 'Groq API key not configured. AI unavailable.' };
    }

    const messages = [
      {
        role: 'system' as const,
        content: systemContext || 'You are a helpful AI tutor. Be concise and helpful.',
      },
      { role: 'user' as const, content: prompt },
    ];

    const completion = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      max_tokens: 512,
      temperature: 0.2,
      top_p: 1,
      n: 1,
    });

    const answer = completion?.choices?.[0]?.message?.content ?? '';
    const reply = answer.trim();

    return { reply };
  }
);
