import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
  HttpsCallableResult,
} from "firebase/functions";
import { getApp } from "firebase/app";


export function getFunctionsClient() {
  const app = getApp();
  const functions = getFunctions(app);

 if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
    const port = Number(process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_PORT ?? 5001);
    // console.log("Using Functions emulator at:", "127.0.0.1", port); 
    connectFunctionsEmulator(functions, "127.0.0.1", port);
  }

  return functions;
}

export type AiChatResponse = {
  reply?: string;
  error?: string;
  answer?: string; 
  text?: string;
  raw?: any;
};

/**
 * callAiChat
 * Calls Firebase function "aiChat" with prompt & optional context
 * Safely extracts reply or returns a readable error
 */
export async function callAiChat(
  prompt: string,
  context?: string
): Promise<AiChatResponse> {
  if (!prompt || !prompt.trim()) {
    throw new Error("Prompt must not be empty.");
  }

  try {
    const functions = getFunctionsClient();
    const fn = httpsCallable(functions, "aiChat");
    const result: HttpsCallableResult<any> = await fn({ prompt, context });
    const data = result?.data;

    const reply =
      data?.reply ??
      data?.answer ??
      data?.text ??
      data?.content ??
      data?.raw?.choices?.[0]?.message?.content ??
      data?.raw?.choices?.[0]?.text;

    return {
      reply,
      raw: data,
    };
  } catch (error: any) {
    const message =
      error?.message ??
      error?.details ??
      error?.data?.error ??
      "Unknown AI error occurred";
    return { error: message };
  }
}

/**
 * callCreateCourse
 * Example wrapper for your createCourse cloud function
 */
export async function callCreateCourse(payload: {
  title: string;
  description?: string;
  price?: number;
}) {
  const functions = getFunctionsClient();
  const fn = httpsCallable(functions, "createCourse");
  const res = await fn(payload);
  return res.data as { id: string };
}
