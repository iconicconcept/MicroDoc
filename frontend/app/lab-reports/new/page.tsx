"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { labReportsApi } from "@/lib/api/services";
import { patientsApi } from "@/lib/api/services";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function NewLabReportPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [testType, setTestType] = useState("");
  const [status, setStatus] = useState("pending");
  const [resultSummary, setResultSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await patientsApi.getPatients(); // assumes /patients endpoint exists
        if (res.success) setPatients(res.data.items || []);
      } catch (err) {
        toast.error("Failed to load patients");
        console.error("Failed to load patients", err);
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  const handleSubmit = async () => {
    if ( !testType || !resultSummary) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        sampleId: `SAMPLE-${Date.now()}`,
        patientId: selectedPatient,
        testType,
        pathogen: "N/A",
        results: resultSummary,
        antibioticSensitivity: [],
        findings: resultSummary,
        status,
      };

      const response = await labReportsApi.createReport(payload);
      if (response.success) {
        toast.success("Lab report created successfully");
        router.push("/lab-reports");
      } else {
        toast.error("Failed to create lab report");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating report");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPatient) {
    toast.error("Please select a patient");
    return;
  }

  if (!isAuthenticated || !user) return null;

  return (
    <DashboardLayout user={user}>
      <div className="max-w-2xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Create New Lab Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium block mb-2">
                Select Patient
              </label>
              <Select
                value={selectedPatient}
                onValueChange={setSelectedPatient}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {loadingPatients ? (
                    <SelectItem value="">Loading...</SelectItem>
                  ) : (
                    patients.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {p.patientId}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Test Type
              </label>
              <Input
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                placeholder="Enter test type (e.g. Blood Test, Urine Analysis)"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Result Summary
              </label>
              <Textarea
                value={resultSummary}
                onChange={(e) => setResultSummary(e.target.value)}
                rows={6}
                placeholder="Enter lab findings or result summary"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : "Save Report"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
