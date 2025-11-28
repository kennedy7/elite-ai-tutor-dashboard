import { useState } from "react";
import { Menu, X } from "lucide-react";
import AiChat from "./Aichat";

export default function AiChatSidebar() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">

      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg border-r transition-all duration-300
        ${open ? "w-64" : "w-16"} flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h1
            className={`text-lg font-semibold transition-opacity duration-300 ${
              open ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            AI Tutor
          </h1>

          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-md hover:bg-gray-200"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 p-4">
          <ul className="space-y-3 text-sm">
            <li
              className={`p-2 rounded-md hover:bg-gray-200 cursor-pointer ${
                open ? "" : "text-center"
              }`}
            >
              Dashboard
            </li>
            <li
              className={`p-2 rounded-md hover:bg-gray-200 cursor-pointer ${
                open ? "" : "text-center"
              }`}
            >
              Courses
            </li>
            <li
              className={`p-2 rounded-md hover:bg-gray-200 cursor-pointer ${
                open ? "" : "text-center"
              }`}
            >
              Assignments
            </li>
            <li
              className={`p-2 rounded-md hover:bg-gray-200 cursor-pointer ${
                open ? "" : "text-center"
              }`}
            >
              Settings
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t text-xs text-gray-500">
          {open && "© 2025 Your LMS"}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-14 bg-white shadow flex items-center px-4">
          <h2 className="text-xl font-semibold">AI Chat Assistant</h2>
        </header>

        {/* Chat Section */}
        <div className="flex-1 overflow-hidden p-4">
          <AiChat />
        </div>
      </div>
    </div>
  );
}
