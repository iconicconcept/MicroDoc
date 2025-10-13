"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Microscope, Calendar, Activity } from "lucide-react";
import { clinicalNotesApi, labReportsApi } from "@/lib/api/services";
import { useEffect, useState } from "react";
import { ClinicalNote, LabReport } from "@/types/medical";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface ActivityItem {
  id: string;
  type: "clinical_note" | "lab_report";
  title: string;
  description: string;
  timestamp: string;
  icon: any;
  color: string;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const loadRecentActivity = async () => {
    try {
      console.log("Loading recent activity...");

      const [notesResponse, reportsResponse] = await Promise.all([
        clinicalNotesApi.getNotes(1, 5),
        labReportsApi.getReports(1, 5),
      ]);

      console.log("Notes API Response:", notesResponse);
      console.log("Reports API Response:", reportsResponse);

      const noteActivities: ActivityItem[] = [];
      const reportActivities: ActivityItem[] = [];

      // Handle clinical notes response
      if (notesResponse.success) {
        let notes: ClinicalNote[] = [];

        // Try different response structures
        if (notesResponse.data?.data?.items) {
          notes = notesResponse.data.data.items;
        } else if (notesResponse.data?.items) {
          notes = notesResponse.data.items;
        } else if (Array.isArray(notesResponse.data)) {
          notes = notesResponse.data;
        } else {
          console.warn(
            "Unexpected clinical notes response structure:",
            notesResponse
          );
          toast.error("Could not fetch recent notes");
        }

        console.log("Processing clinical notes:", notes);

        notes.forEach((note: ClinicalNote) => {
          noteActivities.push({
            id: note._id,
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
      } else {
        console.warn("Clinical notes API call failed, using mock data");
        // noteActivities.push(...getMockClinicalNoteActivities());
      }

      // Handle lab reports response
      if (reportsResponse.success) {
        let reports: LabReport[] = [];

        // Try different response structures
        if (reportsResponse.data?.data?.items) {
          reports = reportsResponse.data.data.items;
        } else if (reportsResponse.data?.items) {
          reports = reportsResponse.data.items;
        } else if (Array.isArray(reportsResponse.data)) {
          reports = reportsResponse.data;
        } else {
          console.warn(
            "Unexpected lab reports response structure:",
            reportsResponse
          );
          toast.error("Could not fetch recent lab reports");
        }

        console.log("Processing lab reports:", reports);

        reports.forEach((report: LabReport) => {
          reportActivities.push({
            id: report.id,
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
      } else {
        console.warn("Lab reports API call failed, using mock data");
        toast.error("Could not fetch recent lab report activities");
      }

      // Combine and sort activities
      const allActivities = [...noteActivities, ...reportActivities]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 6);

      console.log("Final activities to display:", allActivities);
      setActivities(allActivities);
    } catch (error) {
      console.error("Failed to load recent activity:", error);
      // Use mock data as fallback
      console.log("Using fallback mock data due to error");
      // setActivities(getMockActivities());
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
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
                key={activity.id}
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