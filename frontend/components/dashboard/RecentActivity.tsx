"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Microscope, Calendar, Activity } from "lucide-react";
import { clinicalNotesApi, labReportsApi } from "@/lib/api/services";
import { useEffect, useState } from "react";
import { ClinicalNote, LabReport } from "@/types/medical";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LucideIcon } from "lucide-react";

interface ActivityItem {
  _id: string;
  type: "clinical_note" | "lab_report";
  title: string;
  description: string;
  timestamp: string;
  icon: LucideIcon;
  color: string;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false); // 👈 toggle for showing more

  useEffect(() => {
    loadRecentActivity();
  }, [showAll]);

  const loadRecentActivity = async () => {
    try {
      setIsLoading(true);

      const limit = showAll ? 50 : 5; // 👈 load more when "show more" clicked

      const [notesResponse, reportsResponse] = await Promise.all([
        clinicalNotesApi.getNotes(1, limit),
        labReportsApi.getReports(1, limit),
      ]);

      const noteActivities: ActivityItem[] = [];
      const reportActivities: ActivityItem[] = [];

      // Handle clinical notes response
      if (notesResponse.success) {
        const notes: ClinicalNote[] =
          notesResponse.data?.data?.items ||
          notesResponse.data?.items ||
          (Array.isArray(notesResponse.data) ? notesResponse.data : []);

        notes.forEach((note) => {
          noteActivities.push({
            _id: note._id,
            type: "clinical_note",
            title: `Clinical Note - ${note.patient?.name || "Unknown Patient"}`,
            description: note.content
              ? note.content.length > 60
                ? note.content.substring(0, 60) + "..."
                : note.content
              : "No content available",
            timestamp: note.createdAt,
            icon: FileText,
            color: "text-green-600",
          });
        });
      }

      // Handle lab reports response
      if (reportsResponse.success) {
        const reports: LabReport[] =
          reportsResponse.data?.data?.items ||
          reportsResponse.data?.items ||
          (Array.isArray(reportsResponse.data) ? reportsResponse.data : []);

        reports.forEach((report) => {
          reportActivities.push({
            _id: report._id,
            type: "lab_report",
            title: `Lab Report - ${report.sampleId || "Unknown Sample"}`,
            description: report.findings
              ? report.findings.length > 60
                ? report.findings.substring(0, 60) + "..."
                : report.findings
              : "No findings available",
            timestamp: report.createdAt,
            icon: Microscope,
            color: "text-purple-600",
          });
        });
      }

      // Combine and sort activities by date
      const allActivities = [...noteActivities, ...reportActivities].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(allActivities);
    } catch (error) {
      console.error("Failed to load recent activity:", error);
      toast.error("Failed to load recent activity");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <span>Recent Activity</span>
          </div>
          {activities.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? "Show Less" : "Show More"}
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No recent activity</p>
            <p className="text-sm text-gray-400 mt-1">
              Create your first clinical note or lab report to see activity here
            </p>
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity._id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
              >
                <div
                  className={`p-2 rounded-full bg-gray-100 ${activity.color} flex-shrink-0`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
