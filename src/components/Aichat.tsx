// src/components/AiChat.tsx
import { useState, useRef, useEffect } from "react";
import { getFirestore, collection, addDoc, query, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase"; // your firebase app initialization

interface Message {
  role: "user" | "ai";
  text: string;
}

interface Session {
  id: string;
  createdAt: Date;
  messages: Message[];
}

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const db = getFirestore(app);
  const user = getAuth().currentUser;

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load sessions on mount
  useEffect(() => {
    if (!user) return;

    const fetchSessions = async () => {
      const q = query(
        collection(db, "users", user.uid, "sessions"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const loaded: Session[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        createdAt: doc.data().createdAt.toDate(),
        messages: doc.data().messages,
      }));
      setSessions(loaded);
    };

    fetchSessions();
  }, [user]);


  //Sending a message
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
          context: "You are an AI tutor helping the student learn clearly and concisely.",
        }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data: { reply: string } = await res.json();
      const aiMessage: Message = { role: "ai", text: data.reply || "No response from AI." };

      setMessages((prev) => [...prev, aiMessage]);

      // Save session
      if (user) {
        const messagesToSave = [...messages, userMessage, aiMessage];
        const sessionRef = currentSessionId
          ? doc(db, "users", user.uid, "sessions", currentSessionId)
          : await addDoc(collection(db, "users", user.uid, "sessions"), {
              createdAt: new Date(),
              messages: messagesToSave,
            });

        if (!currentSessionId) setCurrentSessionId(sessionRef.id);
      }
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "⚠️ An error occurred while contacting the AI service, check your internet provider and try again." },
      ]);
    }

    setInput("");
    setLoading(false);
  };
//Pressing Enter triggers sending a message
  const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  const loadSession = (session: Session) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
  };

  const deleteSession = async (sessionId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this session?")) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "sessions", sessionId));
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      // Clear chat if deleted session is currently loaded
      if (currentSessionId === sessionId) {
        setMessages([]);
        setCurrentSessionId(null);
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full max-w-5xl mx-auto p-4 gap-4">
      {/* Sidebar: Sessions */}
      <div className="w-full md:w-64 bg-gray-50 p-3 rounded-md shadow-md overflow-y-auto max-h-[500px]">
        <h2 className="font-semibold mb-2">Past Sessions</h2>
        {sessions.length === 0 && <p className="text-gray-500 text-sm">No sessions yet</p>}
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex justify-between items-center p-2 bg-white rounded shadow hover:bg-gray-100 cursor-pointer"
            >
              <span onClick={() => loadSession(session)} className="truncate">
                {session.createdAt.toLocaleString()}
              </span>
              <button
                onClick={() => deleteSession(session.id)}
                className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-white shadow-md rounded-lg h-[500px] overflow-hidden">
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
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

        <div className="p-3 border-t bg-white flex gap-2">
          <input
            type="text"
            value={input}
            disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyPress}
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
