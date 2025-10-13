"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/lib/store/auth-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { patientsApi } from "@/lib/api/services"; // hypothetical API

export default function NewPatientPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [form, setForm] = useState({
    patientId: `PAT-${Date.now().toString().slice(-6)}`,
    name: "",
    age: "",
    gender: "",
    contact: "",
    address: "",
    medicalHistory: "",
    allergies: "",
    bloodGroup: "",
    cardNumber: "",
    registeredBy: user?.id || "",
    assignedClinician: user?.name || "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.gender ||
      !form.age ||
      !form.contact ||
      !form.address ||
      !form.gender ||
      !form.age ||
      !form.contact ||
      !form.address ||
      !form.bloodGroup
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        allergies: form.allergies
          ? form.allergies.split(",").map((a) => a.trim())
          : [],
        // registeredBy: user?.id,
        registrationDate: new Date().toISOString(),
      };

      console.log("Submitting patient:", payload);
      const response = await patientsApi.createPatient(payload);
      if (response.success) {
        toast.success("Patient registered successfully");
        router.push("/patients");
      } else {
        toast.error("Failed to register patient");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error registering patient");
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
      <div className="max-w-3xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>New Patient Onboarding</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block mb-2">Full Name *</Label>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label className="block mb-2">Gender *</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(val) =>
                      setForm((p) => ({ ...p, gender: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block mb-2">Age *</Label>
                  <Input
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    type="number"
                    placeholder="34"
                  />
                </div>
                <div>
                  <Label className="block mb-2">Phone *</Label>
                  <Input
                    name="contact"
                    value={form.contact}
                    onChange={handleChange}
                    placeholder="+234 704 *** 3184"
                  />
                </div>

                <div>
                  <Label className="block mb-2">Card Number (optional)</Label>
                  <Input
                    name="cardNumber"
                    value={form.cardNumber}
                    onChange={handleChange}
                    type="cardNumber"
                    placeholder="e.g HOSP/2023/00123"
                  />
                </div>

                <div>
                  <Label className="block mb-2">Address</Label>
                  <Input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    type="address"
                    placeholder="your address"
                  />
                </div>

                <div>
                  <Label className="block mb-2">Blood Group</Label>
                  <Select
                    value={form.bloodGroup}
                    onValueChange={(val) =>
                      setForm((p) => ({ ...p, bloodGroup: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Medical Info */}
              <div>
                <Label className="block mb-2">Allergies</Label>
                <Textarea
                  name="allergies"
                  value={form.allergies}
                  onChange={handleChange}
                  placeholder="Enter known allergies (comma-separated)"
                />
              </div>

              <div>
                <Label className="block mb-2">Medical History</Label>
                <Textarea
                  name="medicalHistory"
                  value={form.medicalHistory}
                  onChange={handleChange}
                  placeholder="Brief medical history"
                />
              </div>

              {/* Administrative Info */}
              <div>
                <Label className="block mb-2">Assigned Clinician</Label>
                <Input
                  name="assignedClinician"
                  value={form.assignedClinician}
                  onChange={handleChange}
                  placeholder="Dr. Smith"
                />
              </div>

              <div>
                <Label className="block mb-2">Registered By</Label>
                <Input
                  name="registeredBy"
                  value={form.registeredBy}
                  onChange={handleChange}
                  placeholder="Dr. Smith"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Registering..." : "Register Patient"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
