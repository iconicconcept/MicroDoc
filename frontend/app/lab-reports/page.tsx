"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { labReportsApi } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Plus,
  Search,
  FileText,
  Calendar,
  Filter,
  Microscope,
} from "lucide-react";
import { useRouter } from "next/navigation";
// import VoiceNoteGuideModal from "@/components/clinical/VoiceNoteGuideModal";
// import VoiceNoteModal from "@/components/clinical/VoiceNoteModal";
import DeleteConfirmDialog from "@/components/delete/Delete";

export default function LabReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    if (isAuthenticated) {
      loadReports();
    }
    if (!isAuthenticated || !user) {
      router.replace("/login");
    }
  }, [isAuthenticated, user, router]);

  const loadReports = async () => {
    try {
      const response = await labReportsApi.getReports();
      if (response.success && response.data) {
        setReports(response.data?.items);
      }
    } catch (error) {
      toast.error("Failed to load lab reports");
      console.error("Failed to load lab reports", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = reports.filter(
    (report: any) =>
      report.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.testType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated || !user) {
    return (
      <div className="text-gray-600 text-center mt-10">Redirecting...</div>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lab Reports</h1>
            <p className="text-gray-600 mt-2">
              Manage and review laboratory test results
            </p>
          </div>
          <div className="flex gap-2 space-x-3">
            <Button onClick={() => router.push("/lab-reports/new")}>
              <Plus className="h-4 w-4" />
              New Report
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reports or patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Lab Reports</CardTitle>
            <CardDescription>
              {filteredReports.length} reports found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No reports found
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Start by creating your first lab report"}
                </p>
                <Button onClick={() => router.push("/lab-reports/new")}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Report
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report: any) => (
                  <div
                    key={report.id}
                    className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                      <Microscope className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {report?.name || "Unknown Patient"}
                          </h3>
                          <p className="text-sm text-gray-500 capitalize">
                            {report.testType} • {report.status}
                          </p>
                          <p className="mt-1 text-gray-700 text-sm line-clamp-2">
                            {report.resultSummary}
                          </p>
                        </div>
                        <div className="text-right text-sm flex flex-col gap-2 text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(report.createdAt)}</span>
                          </div>
                          <div className="flex flex-col md:flex-row gap-2">
                            {/* View Details Button */}
                            <div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  router.push(
                                    `/lab-reports/${report._id || report.id}`
                                  )
                                }
                                className="mt-1 cursor-pointer"
                              >
                                View Details
                              </Button>
                            </div>

                            {/* delete labReport */}
                            <div>
                              <DeleteConfirmDialog
                                itemName="Lab Report"
                                onConfirm={async () => {
                                  await labReportsApi.deleteReport(report._id);
                                  router.push("/lab-reports");
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
