"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";

type ThemeChoice = "light" | "dark" | "system";
const STORAGE_KEY = "lms-theme-choice-v1";

export default function SettingsPage() {
  const { user, loading } = useAuth(); // optional: only show settings to signed-in users
  const [theme, setTheme] = useState<ThemeChoice>(() => {
    if (typeof window === "undefined") return "system";
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeChoice | null;
    return saved ?? "system";
  });

  // apply theme on mount + when user changes selection
  useEffect(() => {
    const applyTheme = (choice: ThemeChoice) => {
      const html = document.documentElement;

      if (choice === "system") {
        // remove explicit class and rely on system preference
        html.classList.remove("dark");
        // but if system prefers dark, apply dark class to demonstrate immediate effect
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) html.classList.add("dark");
      } else if (choice === "dark") {
        html.classList.add("dark");
      } else {
        html.classList.remove("dark");
      }
    };

    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage errors (e.g., private mode)
    }
  }, [theme]);

  // Keep system changes reflected if user choice is "system"
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const saved = (localStorage.getItem(STORAGE_KEY) as ThemeChoice | null) ?? "system";
      if (saved === "system") {
        // force re-apply to reflect system change
        setTheme("system");
      }
    };
    mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", handler) : mq.removeListener(handler);
    };
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-3">Settings</h2>
        <p className="text-sm text-gray-500 mb-6">
          Personalize your experience. Theme changes are saved locally for this browser.
        </p>

        <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-gray-100">Appearance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm text-gray-800 dark:text-gray-100">Theme</div>
                <div className="text-xs text-gray-500 dark:text-gray-300">Choose light, dark, or follow system preference.</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTheme("light")}
                  aria-pressed={theme === "light"}
                  className={`px-3 py-2 rounded-md border text-sm ${
                    theme === "light"
                      ? "bg-gray-100 border-gray-300 dark:bg-transparent dark:border-gray-600"
                      : "bg-white border-gray-200 hover:bg-gray-50 dark:bg-transparent"
                  }`}
                >
                  Light
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  aria-pressed={theme === "dark"}
                  className={`px-3 py-2 rounded-md border text-sm ${
                    theme === "dark"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Dark
                </button>

                <button
                  onClick={() => setTheme("system")}
                  aria-pressed={theme === "system"}
                  className={`px-3 py-2 rounded-md border text-sm ${
                    theme === "system"
                      ? "bg-gray-100 border-gray-300"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  System
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs text-gray-500 dark:text-gray-300">Preview</div>

              <div className="mt-3 p-4 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-100">Example card</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">This box shows how the app will look in the selected theme.</div>
                  </div>
                  <div className="text-xs text-gray-400">Aa</div>
                </div>

                <div className="mt-4">
                  <div className="w-full bg-gray-100 dark:bg-gray-800 p-4 rounded">
                    <p className="text-sm text-gray-700 dark:text-gray-200">This is sample content to preview colors and contrast.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Optional: Save preference to Firestore for signed-in users */}
        <div className="mt-6 text-sm text-gray-500">
          {user ? (
            <span>Preference saved locally. Want to persist across devices? I can add saving to your profile in Firestore.</span>
          ) : (
            <span>Sign in to sync settings across devices.</span>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
