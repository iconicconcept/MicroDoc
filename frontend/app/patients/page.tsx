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
import { patientsApi } from "@/lib/api/services";
import { toast } from "sonner";
import { Plus, Search, UserRound, Calendar, Filter, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import VoiceNoteModal from "@/components/clinical/VoiceNoteModal";
import VoiceNoteGuideModal from "@/components/clinical/VoiceNoteGuideModal";

type Patient = {
  _id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  allergies: string;
  address?: string;
  cardNumber?: string;
  bloodGroup?: string;
  assignedClinician?: string;
  createdAt: string;
};

export default function PatientsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadPatients();
    }
  }, [isAuthenticated]);

  const loadPatients = async () => {
    try {
      const response = await patientsApi.getPatients();
      if (response.success && response.data) {
        setPatients(response.data?.items || []);
      }
    } catch (error) {
      toast.error("Failed to load patients");
      console.error("Failed to patients", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.assignedClinician?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.allergies?.includes(searchTerm.toLowerCase()) ||
      p.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.age.toString().includes(searchTerm) ||
      p.gender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // p.cardNumber.includes(searchTerm) ||
      p.assignedClinician?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated || !user) {
    // router.push("/login");
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
            <p className="text-gray-600 mt-2">
              Manage and onboard patients for your facility
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-2 space-x-3">
            <Button variant="outline" onClick={() => setShowGuideModal(true)}>
              <Mic className="h-4 w-4 mr-2" />
              Voice Search
            </Button>
            <Button onClick={() => router.push("/patients/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Patient
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
                  placeholder="Search patients by name, phone, or clinician..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadPatients()}
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

        {/* Patients List */}
        <Card>
          <CardHeader>
            <CardTitle>Onboarded Patients</CardTitle>
            <CardDescription>
              {filteredPatients.length} patient
              {filteredPatients.length !== 1 ? "s" : ""} found
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
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <UserRound className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No patients found
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Get started by adding your first patient"}
                </p>
                <Button onClick={() => router.push("/patients/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Patient
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPatients.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/patients/${p._id}`)}
                  >
                    <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {p.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {p.gender}, {p.age} yrs • {p.bloodGroup || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {p.cardNumber || "Card Num. not Provided"}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(p.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm">
                        {p.contact} • {p.address || "No address provided"}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/patients/${p._id}`)}
                        className="mt-1 cursor-pointer"
                      >
                        View Details
                      </Button>
                      {p.assignedClinician && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                          <strong>Clinician:</strong> {p.assignedClinician}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Voice Modals */}
      <VoiceNoteGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onProceed={() => {
          setShowGuideModal(false);
          setShowVoiceModal(true);
        }}
      />

      <VoiceNoteModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />
    </DashboardLayout>
  );
}
