export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  hospital: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: "clinician" | "microbiologist" | "lab_staff" | "admin";
  department: string;
  hospital: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  _id: string;
  patientId: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  contact?: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalNote {
  _id: string;
  patientId: string;
  clinicianId: string;
  type?: "clinical" | "lab" | "procedure";
  content: string;
  transcript?: string;
  summary?: string;
  priority?: "low" | "medium" | "high";
  isSynced: boolean;
  status?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  plan?: string;
  createdAt: string | Date;
  updatedAt: string;
  patient?: {
    name?: string;
    patientId?: string;
    age?: number;
    gender?: string;
    cardNumber?: string;
  };
}

export interface LabReport {
  _id: string;
  sampleId: string;
  patientId: string;
  microbiologistId: string;
  testType: string;
  pathogen?: string;
  results?: string;
  antibioticSensitivity: string[];
  findings: string;
  status: "pending" | "completed" | "cancelled";
  aiSuggestions: string[];
  specimenType?: string;
  testDate?: string | Date;
  resultSummary?: string;
  remarks?: string;
  requestedBy?: string;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
  patient?: {
    name: string;
    patientId: string;
    age: number;
    gender: string;
  };
}

export interface BurnoutEntry {
  _id: string;
  userId: string;
  hoursWorked: number;
  mood: "excellent" | "good" | "neutral" | "stressed" | "exhausted";
  stressLevel: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface BurnoutAnalytics {
  period: string;
  averageHours: number;
  averageStress: number;
  moodDistribution: Record<string, number>;
  burnoutRisk: "low" | "moderate" | "high";
  totalEntries: number;
  recommendations: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  success: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  overview: {
    totalPatients: number;
    totalClinicalNotes: number;
    totalLabReports: number;
    pendingLabReports: number;
  };
  monthly: {
    clinicalNotes: {
      current: number;
      previous: number;
      trend: number;
    };
    labReports: {
      current: number;
      previous: number;
      trend: number;
    };
  };
  today: {
    clinicalNotes: number;
    labReports: number;
  };
  burnout?: BurnoutEntry[];
}

export type ConnectionStatus = "online" | "offline" | "syncing";
