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
import { clinicalNotesApi } from "@/lib/api/services";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function ClinicalNoteDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, isAuthenticated } = useAuthStore();

  const [note, setNote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: "",
    priority: "",
    chiefComplaint: "",
    diagnosis: "",
    plan: "",
    content: "",
  });

  useEffect(() => {
    if (isAuthenticated && id) fetchNote();
  }, [isAuthenticated, id]);

  const fetchNote = async () => {
    setIsLoading(true);
    try {
      const response = await clinicalNotesApi.getNoteById(id as string);
      if (response.success && response.data) {
        setNote(response.data);
        setForm({
          type: response.data.type || "",
          priority: response.data.priority || "medium",
          chiefComplaint: response.data.chiefComplaint || "",
          diagnosis: response.data.diagnosis || "",
          plan: response.data.plan || "",
          content: response.data.content || "",
        });
      } else toast.error("Failed to load note details");
    } catch (error) {
      toast.error("Error loading note");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await clinicalNotesApi.updateNote(id as string, form);
      if (response.success) {
        toast.success("Note updated successfully");
        setIsEditing(false);
        fetchNote(); // refresh data
      } else {
        toast.error(response.error || "Failed to update note");
      }
    } catch (error) {
      toast.error("Error updating note");
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
          <span className="ml-2 text-gray-600">Loading note...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!note) {
    return (
      <DashboardLayout user={user}>
        <div className="text-center py-20 text-gray-600">
          Clinical note not found.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Clinical Note Details</h1>
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
              <Button onClick={() => setIsEditing(true)}>Edit Note</Button>
            )}
          </div>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {note.patientId?.name || "Unknown Patient"}{" "}
              <span className="text-sm text-gray-500">
                • {note.patientId?.cardNumber || "No Card"} • {formatDate(note.createdAt)}
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Type & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Type</label>
                {isEditing ? (
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clinical">Clinical</SelectItem>
                      <SelectItem value="lab">Lab</SelectItem>
                      <SelectItem value="procedure">Procedure</SelectItem>
                      <SelectItem value="progress">Progress</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={form.type} readOnly />
                )}
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Priority</label>
                {isEditing ? (
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={form.priority} readOnly />
                )}
              </div>
            </div>

            {/* Chief Complaint */}
            <div>
              <label className="text-sm font-medium block mb-2">Chief Complaint</label>
              {isEditing ? (
                <Textarea
                  rows={2}
                  value={form.chiefComplaint}
                  onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded">{form.chiefComplaint || "N/A"}</p>
              )}
            </div>

            {/* Diagnosis */}
            <div>
              <label className="text-sm font-medium block mb-2">Diagnosis</label>
              {isEditing ? (
                <Textarea
                  rows={2}
                  value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded">{form.diagnosis || "N/A"}</p>
              )}
            </div>

            {/* Plan */}
            <div>
              <label className="text-sm font-medium block mb-2">Plan / Recommendation</label>
              {isEditing ? (
                <Textarea
                  rows={3}
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded">{form.plan || "N/A"}</p>
              )}
            </div>

            {/* Detailed Note */}
            <div>
              <label className="text-sm font-medium block mb-2">Detailed Clinical Note</label>
              {isEditing ? (
                <Textarea
                  rows={6}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded whitespace-pre-wrap">{form.content}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => router.push("/clinical-notes")}>
          Back to Notes
        </Button>
      </div>
    </DashboardLayout>
  );
}
