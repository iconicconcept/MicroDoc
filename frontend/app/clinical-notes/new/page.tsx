"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { clinicalNotesApi, patientsApi } from "@/lib/api/services";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bot } from "lucide-react";
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
  const [isRecording, setIsRecording] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);
  const [conversation, setConversation] = useState<
    { type: string; text: string }[]
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [extractedData, setExtractedData] = useState<any>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  const conversationFlow = [
    {
      field: "patient",
      question: "Which patient is this note for? Provide name or ID.",
      extract: (text: string) => {
        const patient = patients.find(
          (p) =>
            text.toLowerCase().includes(p.name.toLowerCase()) ||
            text.toLowerCase().includes(p.patientId.toLowerCase())
        );
        return patient?._id || null;
      },
    },
    {
      field: "chiefComplaint",
      question: "What is the patient’s chief complaint?",
      extract: (text: string) => text,
    },
    {
      field: "diagnosis",
      question: "What is your diagnosis?",
      extract: (text: string) => text,
    },
    {
      field: "plan",
      question: "What is your treatment plan?",
      extract: (text: string) => text,
    },
    {
      field: "type",
      question: "What type of note? (Clinical, Lab, or Procedure)",
      extract: (text: string) => {
        const lower = text.toLowerCase();
        if (lower.includes("lab")) return "lab";
        if (lower.includes("procedure")) return "procedure";
        return "clinical";
      },
    },
    {
      field: "priority",
      question: "Priority? (Low, Medium, High)",
      extract: (text: string) => {
        const lower = text.toLowerCase();
        if (lower.includes("high")) return "high";
        if (lower.includes("low")) return "low";
        return "medium";
      },
    },
    {
      field: "content",
      question: "Please provide the detailed note.",
      extract: (text: string) => text,
    },
  ];

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

  const startAIMode = () => {
    setIsAIMode(true);
    setCurrentStep(0);
    setConversation([]);
    setExtractedData({});
    askNextQuestion(0);
  };

  const askNextQuestion = (step: number) => {
    if (step < conversationFlow.length) {
      const question = conversationFlow[step].question;
      setCurrentQuestion(question);
      setConversation((prev) => [...prev, { type: "ai", text: question }]);
    } else {
      applyExtractedData();
      setConversation((prev) => [
        ...prev,
        {
          type: "ai",
          text: "✅ All information collected! I've filled in the form for you. Please review and submit.",
        },
      ]);
      setIsAIMode(false);
    }
  };

  const handleUserResponse = async (response: string) => {
    if (!response.trim()) return;
    setConversation((prev) => [...prev, { type: "user", text: response }]);
    setUserInput("");
    setIsProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const currentFlow = conversationFlow[currentStep];
    const extractedValue = currentFlow.extract(response);

    setExtractedData((prev: any) => ({
      ...prev,
      [currentFlow.field]: extractedValue,
    }));

    setIsProcessing(false);
    setCurrentStep(currentStep + 1);
    askNextQuestion(currentStep + 1);
  };

  const applyExtractedData = () => {
    if (extractedData.patient) setSelectedPatient(extractedData.patient);
    if (extractedData.chiefComplaint)
      setChiefComplaint(extractedData.chiefComplaint);
    if (extractedData.diagnosis) setDiagnosis(extractedData.diagnosis);
    if (extractedData.plan) setPlan(extractedData.plan);
    if (extractedData.type) setType(extractedData.type);
    if (extractedData.priority) setPriority(extractedData.priority);
    if (extractedData.content) setContent(extractedData.content);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        await processAudio(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Please allow microphone access to use voice input");
      console.error("Please allow microphone access to use voice input", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    // Replace this mock with your backend AI transcription API
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const mockTranscription = "Patient reports headache and fever for 3 days";
    handleUserResponse(mockTranscription);
  };

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast.error("Please select a patient first.");
      return;
    }

    if (!content.trim()) {
      toast.error("Note content cannot be empty.");
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
        {/* AI Assistant Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col gap-2 lg:flex-row items-center justify-between">
                <span>🧠 AI Assistant</span>
                <div className="flex items-center justify-between gap-4 mt-2">
                  <span className="text-sm">Create New Clinical Note</span>
                  {!isAIMode && (
                    <Button onClick={startAIMode} variant="secondary">
                      Start AI Interview
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50 space-y-2">
                {conversation.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                    <Bot size={32} className="text-indigo-500 mb-2" />
                    <p className="text-base md:text-lg font-medium">
                      Click the{" "}
                      <span className="font-normal text-indigo-600">
                        Start AI Interview
                      </span>{" "}
                      button above to get started.
                    </p>
                  </div>
                ) : (
                  conversation.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        msg.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`px-3 py-2 rounded-lg ${
                          msg.type === "user"
                            ? "bg-indigo-600 text-white"
                            : "bg-white border text-gray-700"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                {isProcessing && (
                  <p className="text-sm text-gray-500">Processing...</p>
                )}
                <div ref={conversationEndRef} />
              </div>

              {isAIMode && (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleUserResponse(userInput)
                      }
                      className="flex-1 border rounded-lg px-3 py-2"
                      placeholder="Type your response..."
                      disabled={isProcessing}
                    />
                    <Button
                      onClick={() => handleUserResponse(userInput)}
                      disabled={!userInput.trim() || isProcessing}
                    >
                      Send
                    </Button>
                  </div>
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "destructive" : "outline"}
                    className="w-full"
                  >
                    {isRecording ? "Stop Recording" : "🎙️ Start Voice Input"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <p className="text-gray-600 text-sm">
              AI-powered documentation for healthcare professionals
            </p>
            {/* <CardTitle>Create New Clinical Note Manually</CardTitle> */}
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
