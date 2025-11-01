"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  clinicalNotesApi,
  patientsApi,
  transcribeAndExtract,
} from "@/lib/api/services";
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

// --- helper function ---
const speak = (text: string) => {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1; // 0.8 - 1.2 recommended
    utterance.pitch = 1;
    window.speechSynthesis.cancel(); // stop any current speech
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech synthesis not supported in this browser.");
  }
};

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

// For browsers where SpeechRecognition isn’t declared in types
declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognition;
    SpeechRecognition?: new () => SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start(): void;
    stop(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
  }

  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
  }
}

interface Patient {
  _id: string;
  name: string;
  patientId: string;
}

interface ExtractedData {
  patient?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  plan?: string;
  type?: string;
  priority?: string;
  content?: string;
}

export default function NewClinicalNotePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [plan, setPlan] = useState("");
  const [type, setType] = useState<"clinical" | "lab" | "procedure">("clinical");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  //const [retryCount, setRetryCount] = useState(0);

  // --- Live Speech Recognition ---
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
  const [extractedData, setExtractedData] = useState<ExtractedData>({});

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
        if (!patient) {
          speak(
            "The patient you mentioned is not in the list. Please select manually."
          );
          toast.warning("Patient not found. Please select manually.");
          return null;
        }
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
      if (res.success) setPatients(res.data?.items || []);
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
      speak(question);

      // Wait for speech to finish, then start recording automatically
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.onend = () => {
        console.log(" AI finished speaking. Starting recording...");
        startRecording(); // Automatically start mic after each question
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      const endMsg =
        "✅ All done! Please review the filled details and click Submit.";
      setConversation((prev) => [...prev, { type: "ai", text: endMsg }]);
      speak(endMsg);
      setIsAIMode(false);
    }
  };

  // --- Confirm response and continue ---
  // const confirmAndContinue = async (
  //   responseText: string,
  //   nextQuestion: string
  // ) => {
  //   const confirmation = `Got it — ${responseText}. ${
  //     nextQuestion ? "Next question:" : "That’s all for now."
  //   }`;
  //   speak(confirmation); // your existing AI voice function

  //   setConversation((prev) => [...prev, { from: "ai", text: confirmation }]);

  //   if (nextQuestion) {
  //     // delay a bit so the confirmation finishes speaking
  //     setTimeout(() => {
  //       speak(nextQuestion);
  //       setConversation((prev) => [
  //         ...prev,
  //         { from: "ai", text: nextQuestion },
  //       ]);
  //     }, 2500);
  //   } else {
  //     // No more questions left
  //     speak(
  //       "All questions are done. Please review the auto-filled fields and submit the form."
  //     );
  //     toast.success("AI interview completed!");
  //   }
  // };

  // const autoStopRecording = (stream: MediaStream, timeout = 10000) => {
  //   const audioContext = new AudioContext();
  //   const source = audioContext.createMediaStreamSource(stream);
  //   const analyser = audioContext.createAnalyser();
  //   source.connect(analyser);
  //   const dataArray = new Uint8Array(analyser.fftSize);
  //   let silenceTimer: NodeJS.Timeout | null = null;

  //   const checkSilence = () => {
  //     analyser.getByteFrequencyData(dataArray);
  //     const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

  //     if (avg < 5) {
  //       if (!silenceTimer) {
  //         silenceTimer = setTimeout(() => {
  //           console.log(" Silence detected, stopping recording");
  //           stopRecording();
  //         }, 3000);
  //       }
  //     } else {
  //       if (silenceTimer) {
  //         clearTimeout(silenceTimer);
  //         silenceTimer = null;
  //       }
  //     }

  //     requestAnimationFrame(checkSilence);
  //   };

  //   checkSilence();
  //   setTimeout(() => stopRecording(), timeout);
  // };

  const handleUserResponse = async (response: string) => {
    if (!response.trim()) return;
    setConversation((prev) => [...prev, { type: "user", text: response }]);
    setUserInput("");
    setIsProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const currentFlow = conversationFlow[currentStep];
    const extractedValue = currentFlow.extract(response);

    if (currentFlow.field === "patient" && !extractedValue) {
      // Stop and let them select manually
      return;
    }

    setExtractedData((prev) => {
      const newData = { ...prev, [currentFlow.field]: extractedValue };
      if (currentFlow.field === "content") applyExtractedData();
      return newData;
    });

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
    if (extractedData.type) setType(extractedData.type as "clinical" | "lab" | "procedure");
    if (extractedData.priority) setPriority(extractedData.type as "low" | "medium" | "high");
    if (extractedData.content) setContent(extractedData.content);
  };

  const startRecording = async () => {
    try {
      startLiveRecognition();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);

      let silenceStart = Date.now();
      const silenceThreshold = 5; // sensitivity (lower = more sensitive)
      const silenceDuration = 2000; // 2 seconds of silence = stop

      const checkSilence = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        if (avg < silenceThreshold) {
          if (Date.now() - silenceStart > silenceDuration) {
            console.log("Silence detected, stopping...");
            stopRecording();
            return;
          }
        } else {
          silenceStart = Date.now();
        }
        requestAnimationFrame(checkSilence);
      };
      checkSilence();

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
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
      // handleNoResponse();
    } catch (err) {
      toast.error("Microphone access denied or unavailable");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      stopLiveRecognition(); // Stop live recognition too
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const result = await transcribeAndExtract.fromAudio(audioBlob);

      if (!result.success || !result.data?.transcription) {
        // Fallback if no voice detected or transcription failed
        toast.warning(
          "I couldn’t hear your response. Please try speaking again."
        );
        speak("I couldn’t hear your response. Please try speaking again.");
        // Retry automatically after 2 seconds
        setTimeout(() => startRecording(), 2000);
        return;
      }

      const transcription = result.data.transcription.trim();

      if (!transcription) {
        toast.warning("No speech detected. Please try again.");
        speak("No speech detected. Please try again.");
        setTimeout(() => startRecording(), 2000);
        return;
      }

      // 🟢 Successfully got transcription
      handleUserResponse(transcription);

      if (result.data.extractedData) {
        setExtractedData((prev) => ({
          ...prev,
          ...result.data.extractedData,
        }));
      }

      // After handling one response, automatically listen for next if still in AI mode
      if (isAIMode && currentStep < conversationFlow.length - 1) {
        console.log("🎤 Ready for next question, auto-listening...");
        //setTimeout(() => startRecording(), 2000); // short delay before next question
      }
    } catch (err) {
      console.error("Transcription error:", err);
      toast.error("Error processing your voice. Please try again.");
      speak("Error processing your voice. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Start Browser Live Transcription ---
  const startLiveRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      setLiveTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended.");

      // Only trigger fallback if nothing was heard AND no recording is already processing
      if (!liveTranscript.trim() && !isProcessing) {
        toast.warning("I didn’t catch that, please repeat.");
        speak("I didn’t catch that, please repeat.");
        // Wait a bit before restarting
        setTimeout(() => startRecording(), 2000);
      } else if (liveTranscript.trim()) {
        handleUserResponse(liveTranscript.trim());
        setLiveTranscript("");
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopLiveRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  // const handleNoResponse = () => {
  //   // Only trigger if currently recording and not processing
  //   if (!isRecording || isProcessing) return;

  //   setTimeout(() => {
  //     if (!isRecording || isProcessing) return; // cancel if user already spoke or it's processing

  //     if (retryCount >= 2) {
  //       speak("Let's skip this question. You can fill it manually later.");
  //       setRetryCount(0);
  //       setCurrentStep((s) => s + 1);
  //       askNextQuestion(currentStep + 1);
  //     } else {
  //       setRetryCount((r) => r + 1);
  //       speak("I couldn’t hear your response. Please try again.");
  //       stopRecording(); // ensure clean restart
  //       setTimeout(() => startRecording(), 2000);
  //     }
  //   }, 5000); // waits 10 seconds of silence
  // };

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
        clinicianId: user?._id || "",
        chiefComplaint,
        diagnosis,
        plan,
        type: type as "clinical" | "lab" | "procedure",
        priority: priority as "low" | "medium" | "high",
        content,
        transcript: content,
        status: "pending",
        // date: new Date().toISOString(),
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
                {isRecording && liveTranscript && (
                  <div className="flex justify-end">
                    <div className="px-3 py-2 rounded-lg bg-indigo-100 text-gray-700 italic animate-pulse">
                      {liveTranscript}
                    </div>
                  </div>
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
                  {patients.map((p: Patient) => (
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
                <Select value={type} onValueChange={(value) => setType(value as "clinical" | "lab" | "procedure")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinical">Clinical</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="procedure">Procedure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">
                  Priority
                </label>
                <Select value={priority} onValueChange={(value) => setPriority(value as "low" | "medium" | "high")}>
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
