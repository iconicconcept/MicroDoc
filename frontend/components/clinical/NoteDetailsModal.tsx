"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ClinicalNote } from "@/types/medical";

interface NoteDetailsModalProps {
  open: boolean;
  onClose: () => void;
  note: ClinicalNote | null;
}

export default function NoteDetailsModal({
  open,
  onClose,
  note,
}: NoteDetailsModalProps) {
  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Clinical Note — {note.type}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Patient and metadata */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            <p>
              <strong>Patient ID:</strong> {note.patientId}
            </p>
            <p>
              <strong>Clinician:</strong> {note.clinicianId}
            </p>
            <p>
              <strong>Priority:</strong> <Badge>{note.priority}</Badge>
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <Badge variant="outline">{note.status}</Badge>
            </p>
          </div>

          <Separator />

          {/* Scrollable note content */}
          <ScrollArea className="h-[250px] rounded-md border p-3">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {note.content}
            </p>
          </ScrollArea>

          {/* Transcript (if available) */}
          {note.transcript && (
            <>
              <h4 className="text-sm font-medium text-gray-700 mt-4">
                AI Transcript
              </h4>
              <ScrollArea className="h-[150px] rounded-md border p-3">
                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {note.transcript}
                </p>
              </ScrollArea>
            </>
          )}

          {/* Summary (optional) */}
          {note.summary && (
            <>
              <h4 className="text-sm font-medium text-gray-700 mt-4">
                Summary
              </h4>
              <ScrollArea className="h-[100px] rounded-md border p-3">
                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {note.summary}
                </p>
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
