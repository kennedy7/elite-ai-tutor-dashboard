"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getApp } from "firebase/app";

type ThemeChoice = "light" | "dark" | "system";

export default function ThemeToggle() {
  const { user } = useAuth();
  const { theme, setTheme, systemTheme } = useTheme();
  const db = getFirestore(getApp());

  const [localChoice, setLocalChoice] = useState<ThemeChoice>("system");

  // Sync next-themes -> local UI state
  useEffect(() => {
    if (!theme) return;
    setLocalChoice(theme as ThemeChoice);
  }, [theme]);

  // Load user preference from Firestore on mount
  useEffect(() => {
    if (!user) return;
    let mounted = true;

    (async () => {
      try {
        const ref = doc(db, "users", user.uid, "settings", "prefs");
        const snap = await getDoc(ref);
        if (!mounted) return;

        if (snap.exists()) {
          const data = snap.data() as { theme?: ThemeChoice };
          if (data.theme) {
            setTheme(data.theme); // apply globally
          }
        }
      } catch (err) {
        console.error("Error reading theme from Firestore:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user, db, setTheme]);

  // Apply and persist theme to next-themes + Firestore
  const applyTheme = async (choice: ThemeChoice) => {
    setTheme(choice);        // updates <html> and persists via next-themes
    setLocalChoice(choice);  // updates button UI

    if (!user) return;

    try {
      const ref = doc(db, "users", user.uid, "settings", "prefs");
      await setDoc(ref, { theme: choice }, { merge: true });
    } catch (err) {
      console.error("Failed saving theme to Firestore:", err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        aria-pressed={localChoice === "light"}
        onClick={() => applyTheme("light")}
        title="Light"
        className={`p-2 rounded ${localChoice === "light" ? "ring-2 ring-offset-1 ring-indigo-300" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
      >
        🌤
      </button>

      <button
        aria-pressed={localChoice === "dark"}
        onClick={() => applyTheme("dark")}
        title="Dark"
        className={`p-2 rounded ${localChoice === "dark" ? "ring-2 ring-offset-1 ring-indigo-300" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
      >
        🌙
      </button>

      <button
        aria-pressed={localChoice === "system"}
        onClick={() => applyTheme("system")}
        title={`System (${systemTheme ?? "unknown"})`}
        className={`p-2 rounded ${localChoice === "system" ? "ring-2 ring-offset-1 ring-indigo-300" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
      >
        💻
      </button>
    </div>
  );
}
