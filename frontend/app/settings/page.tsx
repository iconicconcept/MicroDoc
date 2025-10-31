import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/store/auth-store";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const SettingsPage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="text-gray-600 text-center mt-10">Redirecting...</div>
    );
  }
  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account and preferences here.
        </p>
        <p>
            (Settings functionality to be implemented)
        </p>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
