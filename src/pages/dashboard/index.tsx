"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import LogoutButton from "@/components/LogoutButton";
import AiChatSidebar from "@/components/AiChatSidebar";

export default function DashboardPage() {
  const { user, loading } = useAuth();

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

  return <AiChatSidebar />;
}
