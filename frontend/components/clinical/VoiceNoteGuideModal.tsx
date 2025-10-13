'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth-store';
import { Mic, Info } from 'lucide-react';

interface VoiceNoteGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export default function VoiceNoteGuideModal({ isOpen, onClose, onProceed }: VoiceNoteGuideModalProps) {
  const { user } = useAuthStore();
  const role = user?.role || 'clinician';

  const roleGuides: Record<string, string> = {
    clinician: `
      As a clinician, you can use AI Voice Notes to quickly record your observations, 
      symptoms, and findings during consultations. The AI will transcribe your speech, 
      summarize the case, and generate a clinical note ready for review and saving.
    `,
    microbiologist: `
      As a microbiologist, use AI Voice Notes to record your lab findings, 
      sample observations, and results during analysis. The AI assists in generating 
      detailed microbiology reports and summaries automatically.
    `,
    lab_staff: `
      As a lab staff, you can record lab test details and sample tracking notes. 
      The AI helps organize your voice notes into structured test records 
      that can be shared with clinicians or microbiologists.
    `
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-blue-500" />
            <span>AI Voice Note Guide</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>{roleGuides[role]}</p>
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
            <Mic className="inline-block h-4 w-4 text-blue-600 mr-1" />
            <strong>Tip:</strong> Speak naturally and clearly. The AI detects medical terms 
            and automatically structures your note for saving.
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onProceed}>Okay, understood</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
