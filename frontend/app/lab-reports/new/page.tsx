"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { labReportsApi, patientsApi } from "@/lib/api/services";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
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

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  // const [loadingPatients, setLoadingPatients] = useState(true);

  const [form, setForm] = useState({
    testType: "",
    specimenType: "",
    testDate: "",
    requestedBy: "",
    resultSummary: "",
    pathogen: "",
    remarks: "",
    status: "pending",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await patientsApi.getPatients(1, 50);
        if (res.success) setPatients(res.data.items || []);
      } catch (err) {
        toast.error("Failed to load patients");
        console.error("Failed to load patients", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleSubmit = async () => {
    if (!selectedPatient || !form.testType || !form.resultSummary || !form.specimenType)
      return toast.error("Please fill all required fields");

    setLoading(true);
    try {
      const payload = {
        sampleId: `SAMPLE-${Date.now()}`,
        patientId: selectedPatient,
        ...form,
      };

      const response = await labReportsApi.createReport(payload);
      if (response.success) {
        toast.success("Lab report created successfully");
        router.push("/lab-reports");
      } else {
        toast.error("Failed to create lab report");
      }
    } catch (err) {
      toast.error("Error creating lab report");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p: any) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name} ({p.patientId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Test Type</label>
              <Input
                placeholder="e.g. Blood Test, Urinalysis"
                value={form.testType}
                onChange={(e) => handleChange("testType", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Specimen Type</label>
              <Input
                placeholder="e.g. Blood, Urine, Sputum"
                value={form.specimenType}
                onChange={(e) => handleChange("specimenType", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Test Date</label>
              <Input
                type="date"
                value={form.testDate}
                onChange={(e) => handleChange("testDate", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Requested By
              </label>
              <Input
                placeholder="Doctor or Department"
                value={form.requestedBy}
                onChange={(e) => handleChange("requestedBy", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Result Summary
              </label>
              <Textarea
                rows={5}
                placeholder="Enter summary or findings"
                value={form.resultSummary}
                onChange={(e) => handleChange("resultSummary", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Pathogen (optional)
              </label>
              <Input
                placeholder="e.g. E. coli, S. aureus"
                value={form.pathogen}
                onChange={(e) => handleChange("pathogen", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Remarks</label>
              <Textarea
                rows={3}
                placeholder="Additional notes or comments"
                value={form.remarks}
                onChange={(e) => handleChange("remarks", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Status</label>
              <Select
                value={form.status}
                onValueChange={(val) => handleChange("status", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
