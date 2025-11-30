import { useState, useRef, useEffect } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  DocumentData,
  DocumentReference,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import LogoutButton from "@/components/LogoutButton";
import toast, { Toaster } from "react-hot-toast";
import DashboardLayout from "@/components/layouts/DashboardLayout";

/* ---------- simple offline queue (localStorage) ---------- */
const QUEUE_KEY = "ai_session_save_queue_v1";

type QueueItem = {
  id: string;
  payload: {
    userId: string;
    sessionId?: string;
    messages: any[];
  };
  createdAt: number;
  retries?: number;
};

function readQueue(): QueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueueItem[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(q: QueueItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

function enqueueQueue(payload: QueueItem["payload"]) {
  const q = readQueue();
  const item: QueueItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    payload,
    createdAt: Date.now(),
    retries: 0,
  };
  q.push(item);
  writeQueue(q);
  return item.id;
}

function dequeueQueue(id: string) {
  const q = readQueue();
  const filtered = q.filter((i) => i.id !== id);
  writeQueue(filtered);
}

/* ---------- component ---------- */
interface Message {
  role: "user" | "ai";
  text: string;
  createdAt?: string;
}

interface Session {
  id: string;
  createdAt: Date;
  messages: Message[];
  name?: string;
}

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const db = getFirestore(app);
  const auth = getAuth(app);
  const user = auth.currentUser;

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch sessions for user on mount / when user changes
  useEffect(() => {
    if (!user) return;

    const fetchSessions = async () => {
      try {
        const q = query(collection(db, "users", user.uid, "sessions"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const loaded: Session[] = snapshot.docs.map((d) => {
          const data = d.data() as DocumentData;
          return {
            id: d.id,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            messages: (data.messages || []) as Message[],
            name: data.name,
          };
        });
        setSessions(loaded);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
        toast.error("Failed to load sessions. Check console.");
      }
    };

    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Flush queued saves (attempt to write any queued items to Firestore)
  useEffect(() => {
    if (!user) return;
    let mounted = true;

    async function flushQueue() {
      const q = readQueue();
      if (!q.length) return;
      for (const item of q) {
        try {
          if (!mounted) return;
          const { userId, sessionId, messages } = item.payload;
          if (!userId) {
            dequeueQueue(item.id);
            continue;
          }
          if (sessionId) {
            const sessionRef = doc(db, "users", userId, "sessions", sessionId);
            await updateDoc(sessionRef, { messages, updatedAt: serverTimestamp() });
          } else {
            const sessionsCol = collection(db, "users", userId, "sessions");
            await addDoc(sessionsCol, {
              name: `Session ${new Date().toLocaleString()}`,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              messages,
            });
          }
          dequeueQueue(item.id);
          toast.success("Queued session saved");
        } catch (err) {
          console.warn("Retry failed for queued item", item.id, err);
          const current = readQueue();
          const updated = current.map((it) => (it.id === item.id ? { ...it, retries: (it.retries || 0) + 1 } : it));
          writeQueue(updated);
          const updatedItem = updated.find((it) => it.id === item.id);
          if ((updatedItem?.retries ?? 0) > 5) {
            dequeueQueue(item.id);
            toast.error("Dropped a queued save after several failed attempts");
          }
        }
      }
    }

    flushQueue();
    const onOnline = () => flushQueue();
    window.addEventListener("online", onOnline);

    return () => {
      mounted = false;
      window.removeEventListener("online", onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const formatTime = (iso?: string) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const renderTextAsParagraphs = (text: string) =>
    text.split("\n\n").map((block, i) => (
      <p key={i} className="mb-2 leading-relaxed text-sm">
        {block.split("\n").map((line, idx, arr) => (
          <span key={idx}>
            {line}
            {idx < arr.length - 1 && <br />}
          </span>
        ))}
      </p>
    ));

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (err) {
      console.error("Copy failed", err);
      toast.error("Copy failed");
    }
  };

  const saveOrCreateSession = async (messagesToSave: Message[], sessionId?: string) => {
    if (!user) {
      console.warn("No user: session not saved");
      toast.error("Sign in to save sessions");
      return null;
    }

    try {
      if (sessionId) {
        const sessionRef = doc(db, "users", user.uid, "sessions", sessionId);
        await updateDoc(sessionRef, {
          messages: messagesToSave,
          updatedAt: serverTimestamp(),
        });
        toast.success("Session updated");
        return sessionId;
      } else {
        const sessionsCol = collection(db, "users", user.uid, "sessions");
        const docRef = await addDoc(sessionsCol, {
          name: `Session ${new Date().toLocaleString()}`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          messages: messagesToSave,
        });
        toast.success("Session created");
        return (docRef as DocumentReference).id;
      }
    } catch (err) {
      console.error("saveOrCreateSession error:", err);
      try {
        enqueueQueue({ userId: user.uid, sessionId, messages: messagesToSave });
        toast("Saved to offline queue — will retry when online", { icon: "💾" });
      } catch (queueErr) {
        console.error("Failed to enqueue session save", queueErr);
        toast.error("Failed to save session (and enqueue). Check console.");
      }
      return null;
    }
  };

  const startNewSession = async () => {
    if (!user) {
      toast.error("You must be signed in to create a session.");
      return;
    }
    setMessages([]);
    setLoading(false);
    try {
      const sessionsCol = collection(db, "users", user.uid, "sessions");
      const docRef = await addDoc(sessionsCol, {
        name: `Session ${new Date().toLocaleString()}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messages: [],
      });
      const newId = (docRef as DocumentReference).id;
      setCurrentSessionId(newId);
      setSessions((prev) => [{ id: newId, createdAt: new Date(), messages: [], name: `Session ${new Date().toLocaleString()}` }, ...prev]);
      toast.success("New session started");
    } catch (err) {
      console.error("Failed to start new session:", err);
      toast.error("Could not start new session. Check console.");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", text: input.trim(), createdAt: new Date().toISOString() };
    setMessages((prev) => {
      const afterUser = [...prev, userMessage];
      messagesRef.current = afterUser;
      return afterUser;
    });

    setLoading(true);

    try {
      const res = await fetch("/api/ai/aichat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: input.trim(),
          context: "You are an AI tutor helping the student learn clearly and concisely.",
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data: { reply: string } = await res.json();

      const aiMessage: Message = { role: "ai", text: data.reply || "No response from AI.", createdAt: new Date().toISOString() };
      const newMessages = [...messagesRef.current, aiMessage];
      setMessages(newMessages);
      messagesRef.current = newMessages;

      const savedId = await saveOrCreateSession(newMessages, currentSessionId);
      if (savedId && !currentSessionId) setCurrentSessionId(savedId);

      if (savedId) {
        setSessions((prev) => {
          const existingIndex = prev.findIndex((s) => s.id === savedId);
          const sessionObj: Session = { id: savedId, createdAt: new Date(), messages: newMessages, name: `Session ${new Date().toLocaleString()}` };
          if (existingIndex >= 0) {
            const copy = [...prev];
            copy[existingIndex] = sessionObj;
            return copy;
          }
          return [sessionObj, ...prev];
        });
      }
    } catch (err) {
      console.error("AI Chat Error:", err);
      setMessages((prev) => [...prev, { role: "ai", text: "⚠️ An error occurred while contacting the AI service.", createdAt: new Date().toISOString() }]);
      messagesRef.current = messagesRef.current.concat({ role: "ai", text: "⚠️ An error occurred while contacting the AI service.", createdAt: new Date().toISOString() });
      toast.error("AI service error");
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  const loadSession = (session: Session) => {
    setMessages(session.messages);
    messagesRef.current = session.messages;
    setCurrentSessionId(session.id);
    toast("Session loaded");
  };

  const deleteSession = async (sessionId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this session?")) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "sessions", sessionId));
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        setMessages([]);
        messagesRef.current = [];
        setCurrentSessionId(undefined);
      }
      toast.success("Session deleted");
    } catch (err) {
      console.error("Error deleting session:", err);
      toast.error("Could not delete session. Check console.");
    }
  };

  const renameSession = async (sessionId: string) => {
    if (!user) return;
    const newName = prompt("Enter new session name:");
    if (!newName) return;

    try {
      const sessionRef = doc(db, "users", user.uid, "sessions", sessionId);
      await updateDoc(sessionRef, { name: newName, updatedAt: serverTimestamp() });
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, name: newName } : s)));
      toast.success("Session renamed");
    } catch (err) {
      console.error("Error renaming session:", err);
      toast.error("Could not rename session. Check console.");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto p-4 gap-4">
        {/* Sessions sidebar */}
        <aside className="w-full md:w-72 bg-gray-50 dark:bg-gray-800 p-3 rounded-md shadow-md overflow-y-auto max-h-[700px]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">Past Sessions</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={startNewSession}
                className="text-sm px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                New
              </button>
            </div>
          </div>

          {sessions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-300 text-sm">No sessions yet — click “New” to start.</p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((session) => (
                <li key={session.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div className="flex-1 min-w-0 pr-2">
                    <button onClick={() => loadSession(session)} className="text-left truncate w-full text-gray-900 dark:text-gray-100">
                      {session.name ?? session.createdAt.toLocaleString()}
                    </button>
                    <div className="text-xs text-gray-400 dark:text-gray-300">{session.createdAt.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => renameSession(session.id)}
                      className="px-2 py-1 text-xs bg-yellow-400 text-white rounded hover:bg-yellow-500"
                      title="Rename session"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => deleteSession(session.id)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      title="Delete session"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col bg-white dark:bg-gray-800 shadow-md rounded-lg h-[700px] overflow-hidden relative">
          <div className="absolute top-4 right-4 z-20">
            <LogoutButton redirectTo="/auth/login" />
          </div>

          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Tutor</h3>
              <p className="text-xs text-gray-500 dark:text-gray-300">Ask questions — multi-message sessions are saved automatically.</p>
            </div>
            <div className="text-sm text-gray-400 dark:text-gray-300">{currentSessionId ? "Session active" : "No session selected"}</div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <div className="space-y-6">
              {messages.map((msg, i) =>
                msg.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[78%] bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-br-none shadow transform transition-all">
                      <div className="text-sm whitespace-pre-wrap">{msg.text}</div>
                      <div className="text-xs text-blue-100 mt-2 flex justify-end">{formatTime(msg.createdAt)}</div>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-semibold shadow-md">
                        AI
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="relative bg-white dark:bg-gray-700 border border-indigo-50 dark:border-gray-600 rounded-xl p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-block text-xs bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 px-2 py-0.5 rounded-full">Assistant</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 dark:text-gray-300 hidden sm:inline">{formatTime(msg.createdAt)}</span>
                            <button onClick={() => copyToClipboard(msg.text)} className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 text-sm px-2 py-1 rounded-md" aria-label="Copy reply">
                              Copy
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 text-sm text-gray-800 dark:text-gray-100 leading-relaxed">{renderTextAsParagraphs(msg.text)}</div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-3 items-center">
            <input
              className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              type="text"
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="Ask the AI something..."
            />
            <button onClick={sendMessage} disabled={loading} className={`px-6 py-3 rounded-xl text-white font-medium shadow ${loading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}>
              {loading ? "..." : "Send"}
            </button>
          </div>
        </main>

        <Toaster position="bottom-right" />
      </div>
    </DashboardLayout>
  );
}
