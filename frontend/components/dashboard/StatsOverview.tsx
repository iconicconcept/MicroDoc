import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Microscope, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardStats} from "@/types/medical"

interface StatsOverviewProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

export default function StatsOverview({ stats, isLoading }: StatsOverviewProps) {
  const statCards = [
    {
      title: 'Total Patients',
      value: stats?.overview?.totalPatients || 0,
      icon: Users,
      color: 'text-blue-600 bg-blue-50',
      change: null
    },
    {
      title: 'Clinical Notes',
      value: stats?.overview?.totalClinicalNotes || 0,
      icon: FileText,
      color: 'text-green-600 bg-green-50',
      change: stats?.monthly?.clinicalNotes?.trend || 0
    },
    {
      title: 'Lab Reports',
      value: stats?.overview?.totalLabReports || 0,
      icon: Microscope,
      color: 'text-purple-600 bg-purple-50',
      change: stats?.monthly?.labReports?.trend || 0
    },
    {
      title: 'Pending Reports',
      value: stats?.overview?.pendingLabReports || 0,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
      change: null
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        const isPositive = (stat.change || 0) > 0;
        
        return (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value.toLocaleString()}
              </div>
              {stat.change !== null && (
                <div className={`flex items-center text-xs ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(stat.change)} from last month
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}