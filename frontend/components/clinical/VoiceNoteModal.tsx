'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mic, 
  Square, 
  Play, 
  // X,
  Save,
  Wand2
} from 'lucide-react';
import { clinicalNotesApi } from '@/lib/api/services';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth-store';

interface VoiceNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceNoteModal({ isOpen, onClose }: VoiceNoteModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [category, setCategory] = useState<'clinical' | 'lab' | 'procedure'>('clinical');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { user } = useAuthStore();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // Simulate transcription - in real app, send to speech-to-text service
        simulateTranscription();
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Error accessing microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const simulateTranscription = () => {
    const sampleTranscripts = [
      "Patient presents with fever and cough for 3 days. Temperature 38.5°C, respiratory rate 22. Suspected respiratory infection.",
      "Lab results show elevated white blood cell count. Sputum culture pending. Started on antibiotics.",
      "Procedure: Blood sample collected for CBC and culture. Patient tolerated well."
    ];
    
    const randomTranscript = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)];
    setTranscript(randomTranscript);
    toast.success('Transcription completed');
  };

  const handleSave = async () => {
    if (!transcript.trim()) {
      toast.error('Please record or enter a note before saving.');
      return;
    }

    setIsLoading(true);
    try {
      await clinicalNotesApi.createNote({
        patientId: 'temp-patient-id', // In real app, select from patient list
        clinicianId: user?.id || '',
        type: category,
        content: transcript,
        transcript: transcript,
        priority: priority,
        isSynced: true
      });
      
      toast.success('Clinical note saved successfully');
      onClose();
      setTranscript('');
      setCategory('clinical');
      setPriority('medium');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save clinical note');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAISummary = async () => {
    if (!transcript.trim()) {
      toast.error('Please enter some content first');
      return;
    }

    // Simulate AI summary generation
    const aiSummary = `AI-generated summary for clinical note: ${transcript.substring(0, 100)}... 
Key points extracted: Patient presentation, symptoms, and recommended follow-up.`;
    
    setTranscript(prev => prev + '\n\n--- AI Summary ---\n' + aiSummary);
    toast.success('AI summary generated');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mic className="h-5 w-5 text-primary" />
            <span>Record Clinical Note</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Recording Interface */}
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full transition-all ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-primary hover:bg-primary/90'
              } flex items-center justify-center mx-auto mb-4`}
            >
              {isRecording ? (
                <Square className="h-8 w-8 text-white" />
              ) : (
                <Mic className="h-8 w-8 text-white" />
              )}
            </button>
            <p className="text-gray-600">
              {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
            </p>
          </div>

          {/* Transcript */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Transcript</label>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={6}
              placeholder="Transcript will appear here after recording..."
              className="resize-none"
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinical">Clinical Observation</SelectItem>
                  <SelectItem value="lab">Lab Result</SelectItem>
                  <SelectItem value="procedure">Procedure Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
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

          {/* AI Suggestions */}
          {transcript && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
                <Wand2 className="h-4 w-4" />
                <span>AI Suggestions</span>
              </h4>
              <p className="text-blue-800 text-sm">
                Based on your input, consider documenting: vital signs, symptom duration, 
                physical examination findings, and recommended investigations.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t mb-1">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={simulateTranscription}
              disabled={isRecording}
            >
              <Play className="h-4 w-4 mr-2" />
              Simulate
            </Button>
            <Button
              variant="outline"
              onClick={generateAISummary}
              disabled={!transcript.trim()}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              AI Summary
            </Button>
          </div>
          
          <div className="flex space-x-2">
            {/* <Button
              variant="outline"
              onClick={onClose}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button> */}
            <Button
              onClick={handleSave}
              disabled={!transcript.trim() || isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}