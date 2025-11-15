// functions/src/index.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import OpenAI from "openai";

admin.initializeApp();
const db = admin.firestore();

// ---------------- OpenAI Setup ----------------
const openaiKey = functions.config()?.openai?.key;
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

// ---------------- Types ----------------
interface AiChatData {
  prompt: string;
  context?: string;
}

interface AiChatResponse {
  reply: string;
}

interface CreateCourseData {
  title: string;
  description?: string;
  price?: number;
}

interface CreateCourseResponse {
  id: string;
}

// ---------------- Functions ----------------

// 1️⃣ Create user profile on auth creation
export const createUserProfile = functions.auth.user().onCreate(
  async (user: admin.auth.UserRecord) => {
    try {
      await db.collection("users").doc(user.uid).set({
        email: user.email || null,
        displayName: user.displayName || null,
        role: "student",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`User profile created for ${user.uid}`);
    } catch (err) {
      console.error("createUserProfile error:", err);
    }
  }
);

// 2️⃣ Callable function: createCourse
export const createCourse = functions.https.onCall(
  async (
    data: CreateCourseData,
    context: functions.https.CallableContext
  ): Promise<CreateCourseResponse> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentication required."
      );
    }

    const uid = context.auth.uid;
    const title = data.title?.trim();
    const description = data.description?.trim() || "";
    const price = Number(data.price || 0);

    if (!title) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing 'title'."
      );
    }

    // Check user role
    const userSnap = await db.collection("users").doc(uid).get();
    const role = userSnap.data()?.role ?? null;

    if (role !== "instructor" && role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Requires instructor role."
      );
    }

    const courseRef = db.collection("courses").doc();
    await courseRef.set({
      title,
      description,
      price,
      instructorId: uid,
      published: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { id: courseRef.id };
  }
);

// 3️⃣ Callable function: AI Chat
export const aiChat = functions.https.onCall(
  async (
    data: AiChatData,
    context: functions.https.CallableContext
  ): Promise<AiChatResponse> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentication required."
      );
    }

    const uid = context.auth.uid;
    const prompt = data.prompt?.trim();
    const extraContext = data.context?.trim() || "";

    if (!prompt) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing 'prompt'."
      );
    }

    if (!openai) {
      console.warn("OpenAI not configured. Returning echo.");
      return { reply: `Echo: ${prompt}` };
    }

    try {
      // ✅ Proper typing with `name` property to satisfy TS
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        extraContext
          ? [
              { role: "system", content: extraContext, name: "system" },
              { role: "user", content: prompt, name: "user" },
            ]
          : [{ role: "user", content: prompt, name: "user" }];

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 800,
      });

      const text = response.choices?.[0]?.message?.content ?? "";

      // Save session to Firestore
      await db.collection("ai_sessions").add({
        uid,
        prompt,
        context: extraContext || null,
        response: text,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { reply: text };
    } catch (err) {
      console.error("aiChat error:", err);
      throw new functions.https.HttpsError("internal", "AI request failed.");
    }
  }
);
