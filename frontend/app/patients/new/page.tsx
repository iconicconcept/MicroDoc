"use client";

import { useState, useEffect, useRef } from "react";
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
import { patientsApi } from "@/lib/api/services";
import { Bot, Mic } from "lucide-react";

export default function NewPatientPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  // 🧩 Patient Form State
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

  // === AI INTERVIEW STATES ===
  const [isRecording, setIsRecording] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);
  const [conversation, setConversation] = useState<{ type: string; text: string }[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [extractedData, setExtractedData] = useState<any>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  // === AI QUESTION FLOW ===
  const conversationFlow = [
    { field: "name", question: "What's the patient's full name?", extract: (t: string) => t },
    { field: "age", question: "How old is the patient?", extract: (t: string) => parseInt(t) || "" },
    { field: "gender", question: "What's the patient's gender?", extract: (t: string) => t.toLowerCase().includes("female") ? "female" : t.toLowerCase().includes("male") ? "male" : "other" },
    { field: "contact", question: "What's the patient's phone number?", extract: (t: string) => t },
    { field: "address", question: "Where does the patient live?", extract: (t: string) => t },
    { field: "bloodGroup", question: "What's the patient's blood group?", extract: (t: string) => t.toUpperCase() },
    { field: "allergies", question: "Does the patient have any allergies?", extract: (t: string) => t },
    { field: "medicalHistory", question: "Please give a short medical history.", extract: (t: string) => t },
    { field: "assignedClinician", question: "Which clinician is assigned to this patient?", extract: (t: string) => t },
  ];

  useEffect(() => {
    if (conversationEndRef.current)
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

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
        { type: "ai", text: "✅ Patient information captured and form filled." },
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

    setExtractedData((prev: any) => ({
      ...prev,
      [currentFlow.field]: extractedValue,
    }));

    setIsProcessing(false);
    setCurrentStep(currentStep + 1);
    askNextQuestion(currentStep + 1);
  };

  const applyExtractedData = () => {
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
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await processAudio(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
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
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const mockTranscription = "My name is John Doe, I'm 45 years old, male, blood group O+, no allergies.";
    handleUserResponse(mockTranscription);
  };

  // === FORM HANDLERS ===
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.gender || !form.age || !form.contact || !form.address || !form.bloodGroup) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        age: Number(form.age),
        allergies: form.allergies ? form.allergies.split(",").map((a) => a.trim()) : [],
        registrationDate: new Date().toISOString(),
      };

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
        {/* === AI Assistant Section === */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🤖 AI Assistant</span>
              {!isAIMode && (
                <Button variant="secondary" onClick={startAIMode}>
                  Start with AI
                </Button>
              )}
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
                      Start with AI
                    </span>{" "}
                    button to get started.
                  </p>
                </div>
              ) : (
                conversation.map((msg, i) => (
                  <div key={i} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
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
              {isProcessing && <p className="text-sm text-gray-500">Processing...</p>}
              <div ref={conversationEndRef} />
            </div>

            {isAIMode && (
              <div className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUserResponse(userInput)}
                    className="flex-1 border rounded-lg px-3 py-2"
                    placeholder="Type your response..."
                    disabled={isProcessing}
                  />
                  <Button onClick={() => handleUserResponse(userInput)} disabled={!userInput.trim() || isProcessing}>
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

        {/* === Patient Onboarding Form === */}
        <Card>
          <CardHeader>
            <CardTitle>New Patient Onboarding</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select value={form.gender} onValueChange={(val) => setForm((p) => ({ ...p, gender: val }))}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Age *</Label>
                  <Input name="age" value={form.age} onChange={handleChange} type="number" placeholder="34" />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input name="contact" value={form.contact} onChange={handleChange} placeholder="+234 704 *** 3184" />
                </div>

                <div className="space-y-2">
                  <Label>Card Number (optional)</Label>
                  <Input name="cardNumber" value={form.cardNumber} onChange={handleChange} placeholder="e.g HOSP/2023/00123" />
                </div>

                <div className="space-y-2">
                  <Label>Address *</Label>
                  <Input name="address" value={form.address} onChange={handleChange} placeholder="Home address" />
                </div>

                <div className="space-y-2">
                  <Label>Blood Group *</Label>
                  <Select value={form.bloodGroup} onValueChange={(val) => setForm((p) => ({ ...p, bloodGroup: val }))}>
                    <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                    <SelectContent>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Medical Info */}
              <div className="space-y-2">
                <Label>Allergies</Label>
                <Textarea name="allergies" value={form.allergies} onChange={handleChange} placeholder="Enter known allergies (comma-separated)" />
              </div>

              <div className="space-y-2">
                <Label>Medical History</Label>
                <Textarea name="medicalHistory" value={form.medicalHistory} onChange={handleChange} placeholder="Brief medical history" />
              </div>

              {/* Admin Info */}
              <div className="space-y-2">
                <Label>Assigned Clinician</Label>
                <Input name="assignedClinician" value={form.assignedClinician} onChange={handleChange} placeholder="Dr. Smith" />
              </div>

              <div className="space-y-2">
                <Label>Registered By</Label>
                <Input name="registeredBy" value={form.registeredBy} onChange={handleChange} placeholder="Dr. Smith" />
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
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
