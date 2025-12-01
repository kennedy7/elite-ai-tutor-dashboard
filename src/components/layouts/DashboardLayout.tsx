import { useState } from "react"; 
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const  { user } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Courses", path: "/courses" },
    { name: "Instructor", path: "/instructor" },
    { name: "Students", path: "/students" },
    { name: "AI Chat", path: "aichat" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 ${
          open ? "w-64" : "w-20"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className={`text-lg font-semibold text-gray-900 dark:text-white ${!open && "hidden"}`}>
            ELITE AI TUTOR Dashboard
          </h1>

          <button
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="mt-4 flex flex-col gap-1">
          {menuItems.map((item) => {
            const active = router.pathname.startsWith(item.path);

            return (
              <Link href={item.path} key={item.path}>
                <div
                  className={`cursor-pointer px-4 py-3 text-sm font-medium transition rounded ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {open ? item.name : item.name[0]}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {/* Top Navigation */}
        <header className="bg-white dark:bg-gray-800 h-16 shadow-sm px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {menuItems.find((x) => router.pathname.startsWith(x.path))?.name}
          </h1>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-sm font-medium">{user?.email ?? "Guest"}</span>
            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600"></div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}
