'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import DashboardLayout from '@/components/layout/DashboardLayout';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import StatsOverview from '@/components/dashboard/StatsOverview';
import BurnoutAlert from '@/components/dashboard/BurnoutAlert';
import { analyticsApi } from '@/lib/api/services';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { DashboardStats } from '@/types/medical';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardStats();
    }
    if (!isAuthenticated || !user) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  const loadDashboardStats = async () => {
    try {
      const response = await analyticsApi.getDashboardStats();
      if (response.success && response.data) {
        console.log("Fetched user:", response.data);
        setStats(response.data);
      }
    } catch (error) {
      toast.error('Failed to load dashboard statistics, pls refresh the page.');
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return <div className="text-gray-600 text-center mt-10">Redirecting...</div>;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-50 to-medical-50 rounded-2xl p-6 border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.name.split(" ")[0]}!
              </h1>
              <p className="text-gray-600 mt-2">
                Here&apos;s what&apos;s happening on your dashboard today.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Role</p>
              <p className="text-lg font-semibold text-primary capitalize">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions userRole={user.role} />

        {/* Stats Overview */}
        <StatsOverview stats={stats} isLoading={isLoading} />

        {/* Recent Activity & Burnout Alert */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity />
          <BurnoutAlert user={user} />
        </div>
      </div>
    </DashboardLayout>
  );
}