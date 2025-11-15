"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { callAiChat } from "@/lib/functionsClient";
import LogoutButton from "@/components/LogoutButton";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/auth/login";
    }
  }, [loading, user]);

  if (loading || !user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-center">
          <div className="h-8 w-48 bg-gray-200 rounded mb-3 mx-auto" />
          <div className="h-4 w-64 bg-gray-200 rounded mx-auto" />
        </div>
      </div>
    );

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnswer("");
    setRunning(true);

    try {
      const { reply } = await callAiChat(prompt);
      setAnswer(reply);
    } catch (err: any) {
      setAnswer("Error: " + (err?.message ?? JSON.stringify(err)));
    }

    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Welcome back
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {user.displayName ?? user.email}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/courses"
              className="hidden sm:inline-block px-4 py-2 text-sm bg-white border rounded-md shadow-sm hover:shadow transition"
            >
              Browse courses
            </a>
            <LogoutButton />
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: AI Tutor card */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">AI Tutor</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Ask questions about course content, get summaries, or explanations.
                  </p>
                </div>
                <div className="text-sm text-gray-400">Model: gpt-4o-mini</div>
              </div>

              <form onSubmit={handleAsk} className="mt-6">
                <label htmlFor="prompt" className="sr-only">
                  Ask the AI Tutor
                </label>

                <div className="flex gap-3">
                  <input
                    id="prompt"
                    className="flex-1 rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="e.g. Explain Newton's first law in simple terms..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={running}
                  />
                  <button
                    type="submit"
                    disabled={running || !prompt.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition"
                  >
                    {running ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>
                        Thinking...
                      </>
                    ) : (
                      "Ask"
                    )}
                  </button>
                </div>
              </form>

              {answer ? (
                <div className="mt-5 bg-gray-50 border border-gray-100 p-4 rounded-lg whitespace-pre-wrap text-gray-800">
                  {answer}
                </div>
              ) : (
                <div className="mt-5 text-sm text-gray-400">
                  No answer yet — ask something above.
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="mt-4 flex gap-3">
              <a
                href="/instructor/create-course"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-md shadow-sm hover:shadow transition"
              >
                Create course
              </a>
              <a
                href="/courses"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-md shadow-sm hover:shadow transition"
              >
                View all courses
              </a>
            </div>
          </div>

          {/* Right: Stats / quick info */}
          <aside className="space-y-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700">Progress</h3>
              <p className="mt-2 text-xs text-gray-500">No courses in progress</p>
              <div className="mt-4">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full w-0" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700">Tips</h3>
              <ul className="mt-2 text-sm text-gray-500 list-disc pl-5 space-y-1">
                <li>Ask the AI to summarize lessons before practice.</li>
                <li>Use short prompts for step-by-step explanations.</li>
                <li>Instructors can create courses from the left panel.</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700">Account</h3>
              <p className="mt-2 text-sm text-gray-500">
                Signed in as <span className="font-medium text-gray-700">{user.email}</span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
