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
import { clinicalNotesApi } from "@/lib/api/services";
import { ClinicalNote } from "@/types/medical";
import { formatDate } from "@/lib/utils";
import { Plus, Search, FileText, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";
//import NoteDetailsModal from "@/components/clinical/NoteDetailsModal";

import { useRouter } from "next/navigation";
import DeleteConfirmDialog from "@/components/delete/Delete";

export default function ClinicalNotesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  //const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotes();
    }
    if (!isAuthenticated || !user) {
      router.push("/login");
    }
  }, [isAuthenticated, user, router]);

  const loadNotes = async () => {
    try {
      const response = await clinicalNotesApi.getNotes(1, 20);
      if (response.success && response.data) {
        // const response = await clinicalNotesApi.getNotes(1, 20);
        // if (response.success && response.data) {
        //   const formattedNotes = response.data.items.map((note: ClinicalNote) => ({
        //     ...note,
        //     patient: note.patientId,
        //   }));
        setNotes(response.data.items);
      }
    } catch (error) {
      toast.error("Failed to load clinical notes");
      console.error("Failed to load clinical notes", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // const handleView = (note: ClinicalNote) => {
  //   setSelectedNote(note);
  //   setIsModalOpen(true);
  // };

  if (!isAuthenticated || !user) {
    return (
      <div className="text-gray-600 text-center mt-10">Redirecting...</div>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clinical Notes</h1>
            <p className="text-gray-600 mt-2">
              Manage and review patient clinical documentation
            </p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={() => router.push("/clinical-notes/new")}>
              <FileText className="h-4 w-4 mr-1" />
              New Note
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
                  placeholder="Search notes or patients..."
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

        {/* Notes List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Clinical Notes</CardTitle>
            <CardDescription>
              {filteredNotes.length} notes found
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
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No notes found
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Get started by creating your first clinical note"}
                </p>
                <Button onClick={() => router.push("/clinical-notes/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Note
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotes.map((note) => (
                  <div
                    key={note._id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <div
                        className={`p-3 rounded-full ${
                          note.priority === "high"
                            ? "bg-red-50 text-red-600"
                            : note.priority === "medium"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-green-50 text-green-600"
                        }`}
                      >
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {note.patient?.name || "Unknown Patient"}
                            </h3>
                            <p className="text-sm flex gap-2 text-gray-500 capitalize">
                              {note.type}
                              {/* <Badge
                                className={`text-[6px] p-1.5 rounded-full ${
                                  note.priority === "high"
                                    ? "bg-red-500 text-white"
                                    : note.priority === "medium"
                                    ? "bg-yellow-400 text-black"
                                    : "bg-green-500 text-white"
                                }`}
                              >
                                {note.priority}
                              </Badge> */}
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(note.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-700 text-sm line-clamp-2">
                          {note.content}
                        </p>

                        <div className="flex gap-2 mt-1">
                          {/* View Details Button */}
                          <div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/clinical-notes/${note._id}`)
                              }
                              className="mt-1 cursor-pointer shadow-lg shadow-black/10"
                            >
                              View Details
                            </Button>
                          </div>

                          {/* delete note */}
                          <div>
                            <DeleteConfirmDialog
                              itemName="Lab Report"
                              onConfirm={async () => {
                                await clinicalNotesApi.deleteNote(note._id);
                                router.push("/clinical-notes");
                              }}
                            />
                          </div>
                        </div>
                        {note.summary && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                            <strong>Summary:</strong> {note.summary}
                          </div>
                        )}
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
