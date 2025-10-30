"use client";

import { useEffect, useState } from "react";
import { User } from "@/types/medical";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuthStore } from "@/lib/store/auth-store";
import apiClient from "@/lib/api/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
}

export default function DashboardLayout({
  children,
  user,
}: DashboardLayoutProps) {
  const { isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  //refresh accesstoken every 14 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        await apiClient.post("/auth/refresh");
        console.log("Token refreshed silently");
      } catch (err) {
        console.warn("Token refresh failed", err);
      }
    }, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <div className="flex h-screen bg-gray-50/30">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
