import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { getApp } from "firebase/app";

// Ensure your firebase app is initialized in src/lib/firebase.ts
export function getFunctionsClient() {
  const app = getApp(); // uses the already-initialized app
  const functions = getFunctions(app);
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
    // ensure this host/port matches firebase.json or the output when you started emulators
    connectFunctionsEmulator(functions, "localhost", Number(process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR_PORT ?? 5001));
  }
  return functions;
}

export async function callAiChat(prompt: string, context?: string) {
  const functions = getFunctionsClient();
  const fn = httpsCallable(functions, "aiChat");
  const res = await fn({ prompt, context });
  return res.data as { reply: string };
}

export async function callCreateCourse(payload: { title: string; description?: string; price?: number; }) {
  const functions = getFunctionsClient();
  const fn = httpsCallable(functions, "createCourse");
  const res = await fn(payload);
  return res.data as { id: string };
}
