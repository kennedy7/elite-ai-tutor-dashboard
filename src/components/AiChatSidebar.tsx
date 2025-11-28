import { useState } from "react";
import { Menu, X } from "lucide-react";
import AiChat from "./Aichat";

export default function AiChatSidebar() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg border-r flex flex-col transition-all duration-300 ${
          open ? "w-64" : "w-16"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h1
            className={`text-lg font-semibold transition-all duration-300 ${
              open ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            AI Tutor
          </h1>

          {/* Toggle Button */}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-md hover:bg-gray-200 flex-shrink-0 z-10"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-3 text-sm">
            {["Dashboard", "Courses", "Assignments", "Settings"].map((item) => (
              <li
                key={item}
                className={`p-2 rounded-md hover:bg-gray-200 cursor-pointer text-center ${
                  open ? "text-left pl-2" : "text-center"
                }`}
              >
                {open ? item : item[0]}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t text-xs text-gray-500 flex-shrink-0">
          {open && "© 2025 Your LMS"}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-white shadow flex items-center px-4 flex-shrink-0">
          <h2 className="text-xl font-semibold">AI Chat Assistant</h2>
        </header>

        {/* Chat Section */}
        <main className="flex-1 overflow-auto p-4">
          <AiChat />
        </main>
      </div>
    </div>
  );
}
