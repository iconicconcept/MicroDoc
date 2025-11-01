"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { labReportsApi, patientsApi, transcribeAndExtract } from "@/lib/api/services";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Bot } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface Patient {
  _id: string;
  name: string;
  patientId: string;
}

// interface LabForm {
//   testType: string;
//   specimenType: string;
//   testDate: string;
//   requestedBy: string;
//   resultSummary: string;
//   pathogen: string;
//   remarks: string;
//   status: "pending" | "completed" | "reviewed" | "cancelled";
// }

interface ExtractedData {
  patient?: string;
  testType?: string;
  specimenType?: string;
  testDate?: string;
  requestedBy?: string;
  resultSummary?: string;
  pathogen?: string;
  remarks?: string;
  status?: string;
  [key: string]: unknown; // safe fallback
}


export default function NewLabReportPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");

  const [form, setForm] = useState({
    testType: "",
    specimenType: "",
    testDate: "",
    requestedBy: "",
    resultSummary: "",
    pathogen: "",
    remarks: "",
    status: "pending",
  });

  // === AI INTERVIEW STATES ===
  const [isRecording, setIsRecording] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);
  const [conversation, setConversation] = useState<
    { type: string; text: string }[]
  >([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  // === AI QUESTION FLOW ===
  const conversationFlow = [
    {
      field: "patient",
      question: "Which patient is this lab report for? Provide name or ID.",
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
      field: "testType",
      question: "What type of test was conducted?",
      extract: (text: string) => text,
    },
    {
      field: "specimenType",
      question: "What specimen was used? (e.g., blood, urine)",
      extract: (text: string) => text,
    },
    {
      field: "testDate",
      question: "When was the test performed? (Say a date or time frame)",
      extract: (text: string) => new Date().toISOString().split("T")[0], // default today
    },
    {
      field: "requestedBy",
      question: "Who requested the test?",
      extract: (text: string) => text,
    },
    {
      field: "resultSummary",
      question: "What were the results or findings?",
      extract: (text: string) => text,
    },
    {
      field: "pathogen",
      question: "Was any pathogen detected? If none, say 'none'.",
      extract: (text: string) => text,
    },
    {
      field: "remarks",
      question: "Any additional remarks or notes?",
      extract: (text: string) => text,
    },
    {
      field: "status",
      question:
        "Status of report? (Pending, Completed, Reviewed, or Cancelled)",
      extract: (text: string) => {
        const lower = text.toLowerCase();
        if (lower.includes("review")) return "reviewed";
        if (lower.includes("complete")) return "completed";
        if (lower.includes("cancel")) return "cancelled";
        return "pending";
      },
    },
  ];

  useEffect(() => {
    fetchPatients();
    if (conversationEndRef.current)
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const fetchPatients = async () => {
    try {
      const res = await patientsApi.getPatients(1, 50);
      if (res.success) setPatients(res.data?.items || []);
    } catch (err) {
      toast.error("Failed to load patients");
      console.error("Failed to load patients", err);
    }
  };

  // === AI INTERACTION LOGIC ===
  const startAIMode = () => {
    setIsAIMode(true);
    setConversation([]);
    setExtractedData({});
    setCurrentStep(0);
    askNextQuestion(0);
  };

  const askNextQuestion = (step: number) => {
    if (step < conversationFlow.length) {
      const question = conversationFlow[step].question;
      setConversation((prev) => [...prev, { type: "ai", text: question }]);
    } else {
      applyExtractedData();
      setIsAIMode(false);
      setConversation((prev) => [
        ...prev,
        {
          type: "ai",
          text: "✅ Lab report ready. I've filled in the form for you!",
        },
      ]);
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

    setExtractedData((prev) => ({
      ...prev,
      [currentFlow.field]: extractedValue,
    }));

    setIsProcessing(false);
    setCurrentStep(currentStep + 1);
    askNextQuestion(currentStep + 1);
  };

  const applyExtractedData = () => {
    if (extractedData.patient) setSelectedPatient(extractedData.patient);
    Object.keys(form).forEach((key) => {
      if (extractedData[key])
        setForm((prev) => ({ ...prev, [key]: extractedData[key] }));
    });
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
      console.error("Error accessing microphone", err);
      toast.error("Please allow microphone access");
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
    try {
      const result = await transcribeAndExtract.fromAudio(audioBlob);
      if (result.success) {
        const transcription = result.data.transcription || "";
        handleUserResponse(transcription);
        setExtractedData((prev) => ({
          ...prev,
          ...result.data.extractedData,
        }));
      } else {
        toast.error(result.message || "Failed to process audio");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error sending audio to backend");
    } finally {
      setIsProcessing(false);
    }
  };

  // === SUBMIT FORM ===
  const handleSubmit = async () => {
    if (
      !selectedPatient ||
      !form.testType ||
      !form.resultSummary ||
      !form.specimenType
    )
      return toast.error("Please fill all required fields");

    setLoading(true);
    try {
      const payload = {
        sampleId: `SAMPLE-${Date.now()}`,
        patientId: selectedPatient,
        ...form,
      };

      const response = await labReportsApi.createReport(payload);
      if (response.success) {
        toast.success("Lab report created successfully");
        router.push("/lab-reports");
      } else {
        toast.error("Failed to create lab report");
      }
    } catch (err) {
      toast.error("Error creating lab report");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <DashboardLayout user={user}>
      <div className="max-w-2xl mx-auto py-10">
        {/* === AI Assistant Section === */}
        <div className="max-w-2xl mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col gap-2 lg:flex-row items-center justify-between">
                <span>🧠 AI Assistant</span>
                <div className="flex items-center justify-between gap-4 mt-2">
                  <span className="text-sm">Create New Lab Report</span>
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
                      <span className="font-semibold text-indigo-600">
                        Start AI Interview
                      </span>{" "}
                      button to get started.
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

        {/* === Manual Lab Form === */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Lab Report (Manual)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Select Patient */}
            <div>
              <label className="text-sm font-medium block mb-2">
                Select Patient
              </label>
              <Select
                value={selectedPatient}
                onValueChange={setSelectedPatient}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name} ({p.patientId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Input
                placeholder="Test Type"
                value={form.testType}
                onChange={(e) => setForm({ ...form, testType: e.target.value })}
              />
              <Input
                placeholder="Specimen Type"
                value={form.specimenType}
                onChange={(e) =>
                  setForm({ ...form, specimenType: e.target.value })
                }
              />
              <Input
                type="date"
                value={form.testDate}
                onChange={(e) => setForm({ ...form, testDate: e.target.value })}
              />
              <Input
                placeholder="Requested By"
                value={form.requestedBy}
                onChange={(e) =>
                  setForm({ ...form, requestedBy: e.target.value })
                }
              />
              <Textarea
                placeholder="Result Summary"
                rows={5}
                value={form.resultSummary}
                onChange={(e) =>
                  setForm({ ...form, resultSummary: e.target.value })
                }
              />
              <Input
                placeholder="Pathogen"
                value={form.pathogen}
                onChange={(e) => setForm({ ...form, pathogen: e.target.value })}
              />
              <Textarea
                placeholder="Remarks"
                rows={3}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
              <Select
                value={form.status}
                onValueChange={(val) => setForm({ ...form, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : "Save Report"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
