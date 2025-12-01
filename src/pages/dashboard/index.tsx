"use client";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

export default function DashboardHome() {
  const { user, loading } = useAuth();

  // Example stats — replace with API data later
  const [stats] = useState([
    { label: "Total Courses", value: 12 },
    { label: "Enrolled Students", value: 87 },
    { label: "Messages", value: 34 },
    { label: "AI Chats", value: 152 },
  ]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 animate-pulse">
          <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">

        {/* Welcome */}
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Welcome back, {user?.email?.split("@")[0] || "User"} 👋
        </h1>

        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Here’s what’s happening on your LMS today.
        </p>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((item) => (
            <div
              key={item.label}
              className="
                bg-white dark:bg-gray-800 
                border border-gray-200 dark:border-gray-700 
                rounded-xl p-5 shadow-sm
              "
            >
              <div className="text-sm text-gray-500 dark:text-gray-400">{item.label}</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div
          className="
            mt-10 p-6 bg-white dark:bg-gray-800 
            border border-gray-200 dark:border-gray-700 
            rounded-xl shadow-sm
          "
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Recent Activity
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            You can display upcoming courses, recent chats, logs, analytics, etc.
          </p>

          <div className="mt-4">
            <ul className="space-y-3">
              <li className="text-gray-700 dark:text-gray-300 text-sm">
                • You enrolled 3 new students today.
              </li>
              <li className="text-gray-700 dark:text-gray-300 text-sm">
                • AI assistant handled 12 conversations.
              </li>
              <li className="text-gray-700 dark:text-gray-300 text-sm">
                • 2 new instructors joined this week.
              </li>
            </ul>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
