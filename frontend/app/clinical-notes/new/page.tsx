"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { clinicalNotesApi, patientsApi } from "@/lib/api/services";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import {
//   Mic,
//   MicOff,
//   Sparkles,
//   Send,
//   Loader2,
//   CheckCircle,
// } from "lucide-react";
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

  // AI Voice Features
  // const [isRecording, setIsRecording] = useState(false);
  // const [isAIMode, setIsAIMode] = useState(false);
  // const [conversation, setConversation] = useState([]);
  // const [currentQuestion, setCurrentQuestion] = useState("");
  // const [userInput, setUserInput] = useState("");
  // const [isProcessing, setIsProcessing] = useState(false);
  // const [currentStep, setCurrentStep] = useState(0);
  // const [extractedData, setExtractedData] = useState({});
  //const [askNextQuestion, setAskNextQuestion] = useState({})

  // const mediaRecorderRef = useRef(null);
  // const audioChunksRef = useRef([]);
  // const conversationEndRef = useRef(null);

  // const conversationFlow = [
  //   {
  //     field: "patient",
  //     question:
  //       "Which patient is this clinical note for? Please provide the patient name or ID.",
  //     extract: (text: string) => {
  //       const patient = patients.find(
  //         (p) =>
  //           text.toLowerCase().includes(p.name.toLowerCase()) ||
  //           text.toLowerCase().includes(p.patientId.toLowerCase())
  //       );
  //       return patient?._id || null;
  //     },
  //   },
  //   {
  //     field: "chiefComplaint",
  //     question:
  //       "What is the patient's chief complaint? What brings them in today?",
  //     extract: (text: string) => text,
  //   },
  //   {
  //     field: "diagnosis",
  //     question: "What is your diagnosis or assessment?",
  //     extract: (text: string) => text,
  //   },
  //   {
  //     field: "plan",
  //     question: "What is the treatment plan or recommendations?",
  //     extract: (text: string) => text,
  //   },
  //   {
  //     field: "type",
  //     question: "What type of note is this? (Clinical, Lab, or Procedure)",
  //     extract: (text: string) => {
  //       const lower = text.toLowerCase();
  //       if (lower.includes("lab")) return "lab";
  //       if (lower.includes("procedure")) return "procedure";
  //       return "clinical";
  //     },
  //   },
  //   {
  //     field: "priority",
  //     question: "What is the priority level? (Low, Medium, or High)",
  //     extract: (text: string) => {
  //       const lower = text.toLowerCase();
  //       if (lower.includes("high") || lower.includes("urgent")) return "high";
  //       if (lower.includes("low")) return "low";
  //       return "medium";
  //     },
  //   },
  //   {
  //     field: "content",
  //     question:
  //       "Please provide the detailed clinical note including findings, observations, and any additional information.",
  //     extract: (text: string) => text,
  //   },
  // ];

  useEffect(() => {
    fetchPatients();
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

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

  // const startAIMode = () => {
  //   setIsAIMode(true);
  //   setCurrentStep(0);
  //   setConversation([]);
  //   setExtractedData({});
  //   askNextQuestion(0);
  // };

  // const askNextQuestion = (step) => {
  //   if (step < conversationFlow.length) {
  //     const question = conversationFlow[step].question;
  //     setCurrentQuestion(question);
  //     setConversation((prev) => [...prev, { type: "ai", text: question }]);
  //   } else {
  //     // All questions answered, apply data
  //     applyExtractedData();
  //     setConversation((prev) => [
  //       ...prev,
  //       {
  //         type: "ai",
  //         text: "✅ All information collected! I've filled in the form for you. Please review and submit when ready.",
  //       },
  //     ]);
  //     setIsAIMode(false);
  //   }
  // };

  // const handleUserResponse = async (response) => {
  //   if (!response.trim()) return;

  //   setConversation((prev) => [...prev, { type: "user", text: response }]);
  //   setUserInput("");
  //   setIsProcessing(true);

  //   // Simulate AI processing
  //   await new Promise((resolve) => setTimeout(resolve, 800));

  //   const currentFlow = conversationFlow[currentStep];
  //   const extractedValue = currentFlow.extract(response);

  //   setExtractedData((prev) => ({
  //     ...prev,
  //     [currentFlow.field]: extractedValue,
  //   }));

  //   setIsProcessing(false);
  //   setCurrentStep(currentStep + 1);
  //   askNextQuestion(currentStep + 1);
  // };

  // const applyExtractedData = () => {
  //   if (extractedData.patient) setSelectedPatient(extractedData.patient);
  //   if (extractedData.chiefComplaint)
  //     setChiefComplaint(extractedData.chiefComplaint);
  //   if (extractedData.diagnosis) setDiagnosis(extractedData.diagnosis);
  //   if (extractedData.plan) setPlan(extractedData.plan);
  //   if (extractedData.type) setType(extractedData.type);
  //   if (extractedData.priority) setPriority(extractedData.priority);
  //   if (extractedData.content) setContent(extractedData.content);
  // };

  // const startRecording = async () => {
  //   try {
  //     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //     mediaRecorderRef.current = new MediaRecorder(stream);
  //     audioChunksRef.current = [];

  //     mediaRecorderRef.current.ondataavailable = (event) => {
  //       audioChunksRef.current.push(event.data);
  //     };

  //     mediaRecorderRef.current.onstop = async () => {
  //       const audioBlob = new Blob(audioChunksRef.current, {
  //         type: "audio/wav",
  //       });
  //       await processAudio(audioBlob);
  //       stream.getTracks().forEach((track) => track.stop());
  //     };

  //     mediaRecorderRef.current.start();
  //     setIsRecording(true);
  //   } catch (error) {
  //     console.error("Microphone access denied:", error);
  //     alert("Please allow microphone access to use voice input");
  //   }
  // };

  // const stopRecording = () => {
  //   if (mediaRecorderRef.current && isRecording) {
  //     mediaRecorderRef.current.stop();
  //     setIsRecording(false);
  //   }
  // };

  // const processAudio = async (audioBlob) => {
  //   setIsProcessing(true);

  //   // Simulate transcription (replace with actual API call to your backend)
  //   await new Promise((resolve) => setTimeout(resolve, 1500));

  //   // Mock transcription result
  //   const mockTranscription = "Patient has fever and cough for the past 3 days";

  //   handleUserResponse(mockTranscription);
  // };

  const handleSubmit = async () => {
    if (!selectedPatient) {
      alert("Please select a patient first.");
      return;
    }

    if (!content.trim()) {
      alert("Note content cannot be empty.");
      return;
    }
    if (!chiefComplaint || !diagnosis) {
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
            <p className="text-gray-600 text-sm">
              AI-powered documentation for healthcare professionals
            </p>
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
