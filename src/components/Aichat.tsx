import { useState, useRef, useEffect } from "react";
import { getFirestore, collection, addDoc, query, orderBy, getDocs } from "firebase/firestore";
import { getApp } from "firebase/app";
import { useAuth } from "@/hooks/useAuth"; // your Firebase auth hook

interface Message {
  role: "user" | "ai";
  text: string;
}

interface Session {
  id: string;
  name: string;
  messages: Message[];
  createdAt: string;
}

export default function AiChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const db = getFirestore(getApp());

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch sessions from Firestore
  useEffect(() => {
    if (!user) return;

    const fetchSessions = async () => {
      const sessionsRef = collection(db, "users", user.uid, "sessions");
      const q = query(sessionsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const fetched: Session[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Session, "id">),
      }));
      setSessions(fetched);
    };

    fetchSessions();
  }, [user]);

  const saveSession = async (messagesToSave: Message[]) => {
    if (!user) return;
    try {
      const sessionsRef = collection(db, "users", user.uid, "sessions");
      const docRef = await addDoc(sessionsRef, {
        name: `Session ${new Date().toLocaleString()}`,
        createdAt: new Date(),
        messages: messagesToSave,
      });
      setSessions((prev) => [{ id: docRef.id, name: `Session ${new Date().toLocaleString()}`, messages: messagesToSave, createdAt: new Date().toISOString() }, ...prev]);
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/aichat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: input.trim(),
          context:
            "You are an AI tutor helping the student learn clearly and concisely.",
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data: { reply: string } = await res.json();

      const aiMessage: Message = {
        role: "ai",
        text: data.reply || "Sorry, I couldn't generate a response.",
      };

      const newMessages = [...messages, userMessage, aiMessage];
      setMessages(newMessages);

      // Save session to Firestore
      await saveSession(newMessages);
    } catch (error) {
      const errorMessage: Message = {
        role: "ai",
        text: "⚠️ An error occurred while contacting the AI service.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("AI Chat Error:", error);
    }

    setInput("");
    setLoading(false);
  };

  const loadSession = (session: Session) => {
    setMessages(session.messages);
  };

  return (
    <div className="flex h-full gap-4">
      {/* Sessions List */}
      <div className="w-64 bg-gray-50 p-2 border rounded overflow-y-auto">
        <h3 className="font-semibold mb-2">Past Sessions</h3>
        {sessions.length === 0 && <p className="text-sm text-gray-500">No sessions yet</p>}
        <ul className="space-y-1">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="p-2 bg-white rounded shadow cursor-pointer hover:bg-gray-100 text-sm"
              onClick={() => loadSession(s)}
            >
              {s.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white shadow rounded overflow-hidden">
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-3 flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 max-w-[75%] rounded-lg text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t flex gap-2">
          <input
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask the AI something..."
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-white ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
