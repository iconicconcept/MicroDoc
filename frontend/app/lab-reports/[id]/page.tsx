"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { labReportsApi, patientsApi } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function LabReportDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, isAuthenticated } = useAuthStore();

  const [report, setReport] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    patientId: "",
    testType: "",
    specimenType: "",
    testDate: "",
    requestedBy: "",
    resultSummary: "",
    pathogen: "",
    remarks: "",
    status: "pending",
  });

  useEffect(() => {
    if (isAuthenticated && id) fetchReport();
  }, [isAuthenticated, id]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const [reportRes, patientsRes] = await Promise.all([
        labReportsApi.getReportById(id as string),
        patientsApi.getPatients(1, 50),
      ]);

      if (reportRes.success && reportRes.data) {
        const data = reportRes.data;
        setReport(data);
        setForm({
          patientId: data.patientId?._id || data.patientId || "",
          testType: data.testType || "",
          specimenType: data.specimenType || "",
          testDate: data.testDate ? data.testDate.split("T")[0] : "",
          requestedBy: data.requestedBy || "",
          resultSummary: data.resultSummary || "",
          pathogen: data.pathogen || "",
          remarks: data.remarks || "",
          status: data.status || "pending",
        });
      } else toast.error("Failed to load report details");

      if (patientsRes.success) setPatients(patientsRes.data.items || []);
    } catch (error) {
      toast.error("Error loading report");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await labReportsApi.updateReport(id as string, form);
      if (response.success) {
        toast.success("Report updated successfully");
        setIsEditing(false);
        fetchReport();
      } else {
        toast.error(response.error || "Failed to update report");
      }
    } catch (error) {
      toast.error("Error updating report");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated || !user) {
    router.push("/login");
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex justify-center items-center h-80">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-600">Loading report...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!report) {
    return (
      <DashboardLayout user={user}>
        <div className="text-center py-20 text-gray-600">
          Lab report not found.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Lab Report Details</h1>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Report</Button>
            )}
          </div>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {report.patientId?.name || "Unknown Patient"}{" "}
              <span className="text-sm text-gray-500">
                • {report.patientId?.patientId || "No ID"} • {formatDate(report.createdAt)}
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Patient */}
            <div>
              <label className="text-sm font-medium block mb-2">Patient</label>
              {isEditing ? (
                <Select
                  value={form.patientId}
                  onValueChange={(v) => setForm({ ...form, patientId: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {p.patientId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  readOnly
                  value={report.patientId?.name || "N/A"}
                />
              )}
            </div>

            {/* Test Type & Specimen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Test Type</label>
                {isEditing ? (
                  <Input
                    value={form.testType}
                    onChange={(e) => setForm({ ...form, testType: e.target.value })}
                  />
                ) : (
                  <Input readOnly value={report.testType || "N/A"} />
                )}
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Specimen Type</label>
                {isEditing ? (
                  <Input
                    value={form.specimenType}
                    onChange={(e) => setForm({ ...form, specimenType: e.target.value })}
                  />
                ) : (
                  <Input readOnly value={report.specimenType || "N/A"} />
                )}
              </div>
            </div>

            {/* Test Date & Requested By */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Test Date</label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={form.testDate}
                    onChange={(e) => setForm({ ...form, testDate: e.target.value })}
                  />
                ) : (
                  <Input readOnly value={formatDate(report.testDate)} />
                )}
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Requested By</label>
                {isEditing ? (
                  <Input
                    value={form.requestedBy}
                    onChange={(e) => setForm({ ...form, requestedBy: e.target.value })}
                  />
                ) : (
                  <Input readOnly value={report.requestedBy || "N/A"} />
                )}
              </div>
            </div>

            {/* Result Summary */}
            <div>
              <label className="text-sm font-medium block mb-2">Result Summary</label>
              {isEditing ? (
                <Textarea
                  rows={5}
                  value={form.resultSummary}
                  onChange={(e) => setForm({ ...form, resultSummary: e.target.value })}
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded whitespace-pre-wrap">
                  {report.resultSummary || "N/A"}
                </p>
              )}
            </div>

            {/* Pathogen */}
            <div>
              <label className="text-sm font-medium block mb-2">Pathogen</label>
              {isEditing ? (
                <Input
                  value={form.pathogen}
                  onChange={(e) => setForm({ ...form, pathogen: e.target.value })}
                />
              ) : (
                <Input readOnly value={report.pathogen || "N/A"} />
              )}
            </div>

            {/* Remarks */}
            <div>
              <label className="text-sm font-medium block mb-2">Remarks</label>
              {isEditing ? (
                <Textarea
                  rows={3}
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded whitespace-pre-wrap">
                  {report.remarks || "N/A"}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium block mb-2">Status</label>
              {isEditing ? (
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input readOnly value={report.status || "N/A"} />
              )}
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => router.push("/lab-reports")}>
          Back to Reports
        </Button>
      </div>
    </DashboardLayout>
  );
}
