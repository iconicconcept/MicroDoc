export interface User {
  id: string;
  email: string;
  name: string;
  role: 'clinician' | 'microbiologist' | 'lab_staff' | 'admin';
  department: string;
  hospital: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
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
  type: 'clinical' | 'lab' | 'procedure';
  content: string;
  transcript?: string;
  summary?: string;
  priority: 'low' | 'medium' | 'high';
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

export interface LabReport {
  id: string;
  sampleId: string;
  patientId: string;
  microbiologistId: string;
  testType: string,
  pathogen?: string;
  results?: string;
  antibioticSensitivity: string[];
  findings: string;
  status: 'pending' | 'completed' | 'cancelled';
  aiSuggestions: string[];
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
  // patient?: {
  //   name: string;
  //   patientId: string;
  //   age: number;
  //   gender: string;
  // };
}

export interface BurnoutEntry {
  id: string;
  userId: string;
  hoursWorked: number;
  mood: 'excellent' | 'good' | 'neutral' | 'stressed' | 'exhausted';
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
  burnoutRisk: 'low' | 'moderate' | 'high';
  totalEntries: number;
  recommendations: string[];
}

export interface PaginatedResponse<T> {
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  success: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type ConnectionStatus = 'online' | 'offline' | 'syncing';