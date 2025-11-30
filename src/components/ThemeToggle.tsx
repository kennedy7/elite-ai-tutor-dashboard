"use client";

import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getApp } from "firebase/app";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";

type ThemeChoice = "light" | "dark" | "system";
const STORAGE_KEY = "lms-theme-choice-v1"; // kept for compatibility, next-themes uses this key via ThemeProvider.storageKey

export default function ThemeToggle() {
  const { user } = useAuth();
  const db = getFirestore(getApp());
  const { theme, setTheme, systemTheme } = useTheme();
  const [local, setLocal] = useState<ThemeChoice>(() => {
    if (typeof window === "undefined") return "system";
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeChoice | null;
    return (saved ?? "system") as ThemeChoice;
  });

  // sync next-themes -> local UI state
  useEffect(() => {
    // theme may be 'system' or 'dark' or 'light'
    if (!theme) return;
    const t = (theme as ThemeChoice) || "system";
    setLocal(t);
  }, [theme]);

  // If user is signed in, try to read saved pref once and apply it
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      try {
        const ref = doc(db, "users", user.uid, "settings", "prefs");
        const snap = await getDoc(ref);
        if (!mounted) return;
        if (snap.exists()) {
          const data = snap.data() as { theme?: ThemeChoice };
          if (data?.theme) {
            setTheme(data.theme); // uses next-themes; updates <html>
            return;
          }
        }
      } catch (err) {
        console.error("Could not read theme from Firestore", err);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, db, setTheme]);

  // When local selection changes, set next-themes + persist to Firestore
  const applyAndPersist = async (choice: ThemeChoice) => {
    setLocal(choice);
    setTheme(choice); // next-themes updates <html> class and localStorage (storageKey)
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* ignore */
    }

    if (!user) return;
    try {
      const ref = doc(db, "users", user.uid, "settings", "prefs");
      await setDoc(ref, { theme: choice }, { merge: true });
    } catch (err) {
      console.error("Failed saving theme to Firestore", err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        aria-pressed={local === "light"}
        onClick={() => applyAndPersist("light")}
        title="Light"
        className={`p-2 rounded ${local === "light" ? "ring-2 ring-offset-1 ring-indigo-300" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
      >
        🌤
      </button>

      <button
        aria-pressed={local === "dark"}
        onClick={() => applyAndPersist("dark")}
        title="Dark"
        className={`p-2 rounded ${local === "dark" ? "ring-2 ring-offset-1 ring-indigo-300" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
      >
        🌙
      </button>

      <button
        aria-pressed={local === "system"}
        onClick={() => applyAndPersist("system")}
        title={`System (${systemTheme ?? "unknown"})`}
        className={`p-2 rounded ${local === "system" ? "ring-2 ring-offset-1 ring-indigo-300" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
      >
        💻
      </button>
    </div>
  );
}
