"use client";

// import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mic,
  FileText,
  Microscope,
  UserPlus,
  Zap,
  Stethoscope,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import VoiceNoteModal from "../clinical/VoiceNoteModal";
import VoiceNoteGuideModal from "../clinical/VoiceNoteGuideModal";

interface QuickActionsProps {
  userRole: string;
}

const actions = {
  clinician: [
    {
      name: "AI Assist (Voice Note)",
      description: "Record clinical observations",
      icon: Mic,
      color: "bg-blue-500 hover:bg-blue-600",
      href: "#voice-note",
    },
    {
      name: "Clinical Note",
      description: "Create manual clinical note",
      icon: FileText,
      color: "bg-green-500 hover:bg-green-600",
      href: "/clinical-notes/new",
    },
    {
      name: "New Patient",
      description: "Register new patient",
      icon: UserPlus,
      color: "bg-purple-500 hover:bg-purple-600",
      href: "/patients/new",
    },
    {
      name: "Quick Lab",
      description: "Save Propose lab test",
      icon: Zap,
      color: "bg-amber-500 hover:bg-amber-600",
      href: "/lab-reports/new",
    },
  ],
  microbiologist: [
    {
      name: "AI Assist (Voice Note)",
      description: "Record microbiology report",
      icon: Mic,
      color: "bg-blue-500 hover:bg-blue-600",
      href: "#voice-note",
    },
    {
      name: "Lab Report",
      description: "Create microbiology report",
      icon: Microscope,
      color: "bg-indigo-500 hover:bg-indigo-600",
      href: "/lab-reports/new",
    },
    {
      name: "Sample Analysis",
      description: "Analyze lab samples",
      icon: Stethoscope,
      color: "bg-pink-500 hover:bg-pink-600",
      href: "/lab-reports",
    },
    {
      name: "Culture Results",
      description: "Record culture findings",
      icon: FileText,
      color: "bg-teal-500 hover:bg-teal-600",
      href: "/lab-reports/new?type=culture",
    },
  ],
  lab_staff: [
    {
      name: "AI Assist (Voice Note)",
      description: "Record lab report",
      icon: Mic,
      color: "bg-blue-500 hover:bg-blue-600",
      href: "#voice-note",
    },
    {
      name: "Lab Analysis",
      description: "Handle lab samples",
      icon: Microscope,
      color: "bg-indigo-500 hover:bg-indigo-600",
      href: "/lab-reports",
    },
    {
      name: "Create Analysis",
      description: "Create new test",
      icon: Zap,
      color: "bg-amber-500 hover:bg-amber-600",
      href: "/lab-reports/new",
    },
  ],
};

export default function QuickActions({ userRole }: QuickActionsProps) {
  const router = useRouter();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const userActions =
    actions[userRole as keyof typeof actions] || actions.clinician;

  const handleActionClick = (href: string) => {
    if (href === "#voice-note") {
      setShowGuideModal(true);
    } else {
      router.push(href);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>
            Frequently used actions for your role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {userActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.name}
                  onClick={() => handleActionClick(action.href)}
                  className={`p-4 rounded-xl text-white transition-all hover:scale-105 ${action.color} flex flex-col items-center text-center space-y-2`}
                >
                  <Icon className="h-6 w-6" />
                  <div>
                    <div className="font-semibold text-sm">{action.name}</div>
                    <div className="text-xs opacity-90">
                      {action.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
    </>
  );
}
