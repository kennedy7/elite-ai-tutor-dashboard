import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface LayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Courses", path: "/courses" },
    { name: "Instructor", path: "/instructor" },
    { name: "Students", path: "/students" },
    { name: "AI Chat", path: "aichat" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r shadow-sm transition-all duration-300 ${
          open ? "w-64" : "w-20"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <h1 className={`text-lg font-semibold ${!open && "hidden"}`}>
            LMS Dashboard
          </h1>

          <button
            className="p-2 rounded hover:bg-gray-200"
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
                  className={`cursor-pointer px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-200"
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
        <header className="bg-white h-16 shadow-sm px-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            {menuItems.find((x) => router.pathname.startsWith(x.path))?.name}
          </h1>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-sm font-medium">Kennedy</span>
            <div className="h-10 w-10 rounded-full bg-gray-300"></div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
