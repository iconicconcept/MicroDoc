"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { clinicalNotesApi, patientsApi } from "@/lib/api/services";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function NewClinicalNotePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [plan, setPlan] = useState("");
  const [type, setType] = useState("clinical");
  const [priority, setPriority] = useState("medium");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (!selectedPatient) {
      alert("Please select a patient first.");
      return;
    }

    if (!content.trim()) {
      alert("Note content cannot be empty.");
      return;
    }
    if ( !chiefComplaint || !diagnosis) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!type) {
      toast.error("Please select a note type");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        patientId: selectedPatient,
        clinicianId: user?.id || "",
        chiefComplaint,
        diagnosis,
        plan,
        type: type,
        priority,
        content,
        transcript: content,
        status: "final",
        date: new Date().toISOString(),
        isSynced: true,
      };

      const response = await clinicalNotesApi.createNote(payload);
      if (response.success) {
        toast.success("Clinical note created successfully");
        router.push("/clinical-notes");
      } else {
        toast.error(response.message || "Failed to create note");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating note");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    router.push("/login");
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <div className="max-w-2xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Create New Clinical Note</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Select Patient */}
            <div>
              <label className="text-sm font-medium block mb-2">Patient</label>
              <Select
                value={selectedPatient}
                onValueChange={setSelectedPatient}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
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

            {/* Chief Complaint and Diagnosis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Chief Complaint
                </label>
                <Textarea
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  rows={2}
                  placeholder="e.g., Headache for 3 days"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Diagnosis
                </label>
                <Textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={2}
                  placeholder="e.g., Migraine"
                />
              </div>
            </div>

            {/* Plan / Recommendation */}
            <div>
              <label className="text-sm font-medium block mb-2">
                Plan / Recommendation
              </label>
              <Textarea
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                rows={3}
                placeholder="e.g., Start Sumatriptan 50mg twice daily"
              />
            </div>

            {/* Type and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinical">Clinical</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Priority
                </label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Main Clinical Note */}
            <div>
              <label className="text-sm font-medium block mb-2">
                Detailed Clinical Note
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Enter full clinical note details, findings, and observations"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
