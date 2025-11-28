import { useState, useRef, useEffect } from "react";
import LogoutButton from "@/components/LogoutButton";

interface Message {
  role: "user" | "ai";
  text: string;
}

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

      setMessages((prev) => [...prev, aiMessage]);
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

  const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 relative">
      {/* Floating Logout Button */}
      <div className="absolute top-4 right-4 z-10">
        <LogoutButton redirectTo="/login" />
      </div>

      <div className="bg-white shadow-md rounded-lg h-[500px] flex flex-col overflow-hidden">
        {/* Chat Window */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
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

        {/* Input Row */}
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
