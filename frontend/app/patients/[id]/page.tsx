"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { patientsApi } from "@/lib/api/services";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Edit, Save, ArrowLeft } from "lucide-react";
import { Patient } from "@/types/medical";

const editableFields: (keyof Patient)[] = [
  "name",
  "age",
  "gender",
  "contact",
  "address",
  "medicalHistory",
  "allergies",
];

export default function PatientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Patient>>({});

  useEffect(() => {
    if (id) fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      const res = await patientsApi.getPatientById(id as string);
      if (res.success) {
        setPatient(res.data.patient);
        setForm(res.data.patient);
      } else {
        toast.error("Failed to load patient details");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching patient details");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const res = await patientsApi.updatePatient(id as string, form);
      if (res.success) {
        toast.success("Patient updated successfully");
        setPatient(res.data);
        setIsEditing(false);
      } else {
        toast.error(res.error || "Failed to update patient");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating patient");
    }
  };

  if (!isAuthenticated || !user) {
    router.push("/login");
    return null;
  }

  if (!patient) {
    return (
      <DashboardLayout user={user}>
        <div className="p-6 text-center text-gray-600">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/patients")}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>

          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
          ) : (
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" /> Save
            </Button>
          )}
        </div>

        {editableFields.map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 capitalize">
              {String(field).replace(/([A-Z])/g, " $1")}
            </label>
            {isEditing ? (
              <Input
                name={field}
                value={String(form[field] ?? "")}
                onChange={handleChange}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-gray-900">
                {String(patient[field] ?? "—")}
              </p>
            )}
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Allergies
          </label>
          {isEditing ? (
            <Input
              name="allergies"
              value={(form.allergies || []).join(", ")}
              onChange={(e) =>
                setForm({
                  ...form,
                  allergies: e.target.value.split(",").map((a) => a.trim()),
                })
              }
              className="mt-1"
            />
          ) : (
            <p className="mt-1 text-gray-900">
              {patient.allergies?.length
                ? patient.allergies.join(", ")
                : "None"}
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
