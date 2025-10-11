'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { User } from '@/types/medical';
import { burnoutApi } from '@/lib/api/services';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface BurnoutAlertProps {
  user: User;
}

interface BurnoutData {
  burnoutRisk: 'low' | 'moderate' | 'high';
  averageHours: number;
  averageStress: number;
  recommendations: string[];
}

export default function BurnoutAlert({ user }: BurnoutAlertProps) {
  const [burnoutData, setBurnoutData] = useState<BurnoutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (user.role === 'clinician' || user.role === 'microbiologist') {
      loadBurnoutData();
    }
  }, [user]);

  const loadBurnoutData = async () => {
    try {
      const response = await burnoutApi.getAnalytics('week');
      if (response.success && response.data) {
        setBurnoutData(response.data);
      }
    } catch (error) {
      console.error('Failed to load burnout data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskConfig = (risk: string) => {
    switch (risk) {
      case 'high':
        return {
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: AlertTriangle,
          message: 'High burnout risk detected'
        };
      case 'moderate':
        return {
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          icon: Clock,
          message: 'Moderate burnout risk'
        };
      case 'low':
        return {
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: CheckCircle,
          message: 'Low burnout risk'
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: Heart,
          message: 'Track your wellbeing'
        };
    }
  };

  if (user.role !== 'clinician' && user.role !== 'microbiologist') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wellbeing Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const riskConfig = getRiskConfig(burnoutData?.burnoutRisk || 'low');

  return (
    <Card className={`border-l-4 ${riskConfig.color.split(' ')[2]}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Heart className="h-4 w-4" />
          <span>Wellbeing Check</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`p-3 rounded-lg ${riskConfig.color.split(' ')[1]} border ${riskConfig.color.split(' ')[2]}`}>
          <div className="flex items-center space-x-2">
            <riskConfig.icon className="h-4 w-4" />
            <span className="font-medium text-sm">{riskConfig.message}</span>
          </div>
          {burnoutData && (
            <div className="mt-2 text-xs space-y-1">
              <div>Avg. Hours: <strong>{burnoutData.averageHours}h</strong></div>
              <div>Stress Level: <strong>{burnoutData.averageStress}/5</strong></div>
            </div>
          )}
        </div>

        {burnoutData?.recommendations && burnoutData.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700">Recommendations:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {burnoutData.recommendations.slice(0, 2).map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => router.push('/burnout')}
        >
          Track Wellbeing
        </Button>
      </CardContent>
    </Card>
  );
}