import { apiClient } from "./client";
import {
  User,
  Patient,
  ClinicalNote,
  LabReport,
  BurnoutEntry,
  BurnoutAnalytics,
  PaginatedResponse,
  ApiResponse,
} from "@/types/medical";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000/api";

// Auth Services
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post<
      ApiResponse<{ user: User; token: string }>
    >(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    // localStorage.setItem("token", response.data.token);
    return response.data;
  },

  register: async (userData: {
    email: string;
    password: string;
    name: string;
    role: string;
    department: string;
    hospital: string;
  }) => {
    const response = await apiClient.post<
      ApiResponse<{ user: User; token: string }>
    >(`${API_BASE_URL}/auth/register`, userData);
    // localStorage.setItem("token", response.data.token);
    return response.data;
  },

  getMe: async () => {
    const token = localStorage.getItem("token");
    const response = await apiClient.get<ApiResponse<{ user: User }>>(
      `${API_BASE_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );
    return response.data;
  },

  updateProfile: async (profileData: {
    name?: string;
    department?: string;
    hospital?: string;
  }) => {
    const response = await apiClient.put<ApiResponse<{ user: User }>>(
      `${API_BASE_URL}/auth/profile`,
      profileData
    );
    return response.data;
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(
      `${API_BASE_URL}/auth/change-password`,
      passwordData
    );
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `${API_BASE_URL}/auth/logout`
    );
    return response.data;
  },
};

// Lab Reports Services
export const labReportsApi = {
  getReports: async (page: number = 1, limit: number = 10, filters?: any) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<LabReport>>
    >(`${API_BASE_URL}/lab-reports?${params}`);
    return response.data;
  },

  getReportById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<LabReport>>(
      `${API_BASE_URL}/lab-reports/${id}`
    );
    return response.data;
  },

  createReport: async (
    reportData: Omit<LabReport, "id" | "createdAt" | "updatedAt">
  ) => {
    const response = await apiClient.post<ApiResponse<LabReport>>(
      `${API_BASE_URL}/lab-reports`,
      reportData
    );
    return response.data;
  },

  updateReport: async (id: string, reportData: Partial<LabReport>) => {
    const response = await apiClient.put<ApiResponse<LabReport>>(
      `${API_BASE_URL}/lab-reports/${id}`,
      reportData
    );
    return response.data;
  },

  deleteReport: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `${API_BASE_URL}/lab-reports/${id}`
    );
    return response.data;
  },

  updateStatus: async (
    id: string,
    status: "pending" | "completed" | "cancelled"
  ) => {
    const response = await apiClient.patch<ApiResponse<LabReport>>(
      `${API_BASE_URL}/lab-reports/${id}/status`,
      { status }
    );
    return response.data;
  },

  generateAISuggestions: async (id: string) => {
    const response = await apiClient.post<
      ApiResponse<{ suggestions: string[]; report: LabReport }>
    >(`${API_BASE_URL}/lab-reports/${id}/ai-suggestions`);
    return response.data;
  },
};

// Patients Services
export const patientsApi = {
  getPatients: async (
    page: number = 1,
    limit: number = 10,
    search?: string
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<Patient>>
    >(`${API_BASE_URL}/patients?${params}`);
    return response.data;
  },

  getPatient: (id: string) =>
    apiClient.get<ApiResponse<Patient>>(`${API_BASE_URL}/patients/${id}`),

  getPatientById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Patient>>(
      `${API_BASE_URL}/patients/${id}`
    );
    return response.data;
  },

  createPatient: async (
    patientData: Omit<Patient, "id" | "createdAt" | "updatedAt">
  ) => {
    const response = await apiClient.post<ApiResponse<Patient>>(
      `${API_BASE_URL}/patients`,
      patientData
    );
    return response.data;
  },

  updatePatient: async (id: string, patientData: Partial<Patient>) => {
    const response = await apiClient.put<ApiResponse<Patient>>(
      `${API_BASE_URL}/patients/${id}`,
      patientData
    );
    return response.data;
  },

  deletePatient: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `${API_BASE_URL}/patients/${id}`
    );
    return response.data;
  },

  searchPatients: async (query: string) => {
    const response = await apiClient.get<
      ApiResponse<{ items: Patient[]; total: number }>
    >(`${API_BASE_URL}/patients/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

// Burnout Services
export const burnoutApi = {
  getEntries: async (page: number = 1, limit: number = 10, filters?: any) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<BurnoutEntry>>
    >(`${API_BASE_URL}/burnout?${params}`);
    return response.data;
  },

  createEntry: async (
    entryData: Omit<BurnoutEntry, "id" | "createdAt" | "updatedAt">
  ) => {
    const response = await apiClient.post<ApiResponse<BurnoutEntry>>(
      `${API_BASE_URL}/burnout`,
      entryData
    );
    return response.data;
  },

  updateEntry: async (id: string, entryData: Partial<BurnoutEntry>) => {
    const response = await apiClient.put<ApiResponse<BurnoutEntry>>(
      `${API_BASE_URL}/burnout/${id}`,
      entryData
    );
    return response.data;
  },

  deleteEntry: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `${API_BASE_URL}/burnout/${id}`
    );
    return response.data;
  },

  getAnalytics: async (period: string = "month") => {
    const response = await apiClient.get<ApiResponse<BurnoutAnalytics>>(
      `${API_BASE_URL}/burnout/analytics?period=${period}`
    );
    return response.data;
  },

  getTrends: async (period: string = "month") => {
    const response = await apiClient.get<
      ApiResponse<{ period: string; trends: any[]; totalDays: number }>
    >(`${API_BASE_URL}/burnout/trends?period=${period}`);
    return response.data;
  },

  getRecommendations: async () => {
    const response = await apiClient.get<
      ApiResponse<{ recommendations: string[] }>
    >(`${API_BASE_URL}/burnout/recommendations`);
    return response.data;
  },
};

// Analytics Services
export const analyticsApi = {
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await apiClient.get<ApiResponse<DashboardStats>>(
      `${API_BASE_URL}/analytics/dashboard`
    );
    return response.data;
  },

  getClinicalAnalytics: async (
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<ClinicalAnalytics>> => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await apiClient.get<ApiResponse<ClinicalAnalytics>>(
      `${API_BASE_URL}/analytics/clinical?${params}`
    );
    return response.data;
  },

  getLabAnalytics: async (
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<LabAnalytics>> => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await apiClient.get<ApiResponse<LabAnalytics>>(
      `${API_BASE_URL}/analytics/lab?${params}`
    );
    return response.data;
  },

  getSystemAnalytics: async (): Promise<ApiResponse<SystemAnalytics>> => {
    const response = await apiClient.get<ApiResponse<SystemAnalytics>>(
      `${API_BASE_URL}/analytics/system`
    );
    return response.data;
  },
};

// Analytics Types
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
  burnout?: {
    averageHours: number;
    averageStress: number;
    burnoutRisk: "low" | "moderate" | "high";
    entriesCount: number;
  };
}

export interface ClinicalAnalytics {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalNotes: number;
    noteTypeDistribution: Array<{ _id: string; count: number }>;
    priorityDistribution: Array<{ _id: string; count: number }>;
  };
  trends: {
    daily: Array<{ _id: string; count: number }>;
  };
  topPatients: Array<{
    patientId: string;
    patientName: string;
    noteCount: number;
  }>;
  clinicianStats?: Array<{
    clinicianName: string;
    clinicianRole: string;
    department: string;
    noteCount: number;
  }>;
}

export interface LabAnalytics {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalReports: number;
    testTypeDistribution: Array<{ _id: string; count: number }>;
    statusDistribution: Array<{ _id: string; count: number }>;
    commonPathogens: Array<{ _id: string; count: number }>;
    turnaroundTime: {
      averageTurnaround: number;
      minTurnaround: number;
      maxTurnaround: number;
    };
  };
  trends: {
    daily: Array<{ _id: string; count: number }>;
  };
  microbiologistStats?: Array<{
    microbiologistName: string;
    department: string;
    reportCount: number;
    completedCount: number;
    completionRate: number;
  }>;
}

export interface SystemAnalytics {
  userStatistics: Array<{ _id: string; count: number; active: number }>;
  usageTrends: Array<{
    date: string;
    clinicalNotes: number;
    labReports?: number;
  }>;
  busiestDays: Array<{
    dayOfWeek: number;
    noteCount: number;
    dayName: string;
  }>;
  departmentStats: Array<{
    department: string;
    userCount: number;
    roleDistribution: {
      clinicians: number;
      microbiologists: number;
      labStaff: number;
    };
  }>;
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalPatients: number;
    totalClinicalNotes: number;
    totalLabReports: number;
  };
}

// Clinical Notes Services - Fixed
export const clinicalNotesApi = {
  // Get all clinical notes
  getNotes: async (
    page: number = 1,
    limit: number = 10,
    filters?: Record<string, any>
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters || {}),
    });

    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<ClinicalNote>>
    >(`${API_BASE_URL}/clinical-notes?${params}`);

    return response.data;
  },

  // Create a new clinical note
  createNote: async (data: Partial<ClinicalNote>) => {
    const response = await apiClient.post(
      `${API_BASE_URL}/clinical-notes`,
      data
    );
    return response.data;
  },

  // Get a note by ID
  getNoteById: async (id: string) => {
    const response = await apiClient.get(
      `${API_BASE_URL}/clinical-notes/${id}`
    );
    return response.data;
  },

  // Update a note
  updateNote: async (id: string, data: Partial<ClinicalNote>) => {
    const response = await apiClient.put(
      `${API_BASE_URL}/clinical-notes/${id}`,
      data
    );
    return response.data;
  },

  // Delete a note
  deleteNote: async (id: string) => {
    const response = await apiClient.delete(
      `${API_BASE_URL}/clinical-notes/${id}`
    );
    return response.data;
  },

  // Get notes by patient
  getNotesByPatient: async (patientId: string, page = 1, limit = 10) => {
    const response = await apiClient.get(
      `${API_BASE_URL}/clinical-notes/patient/${patientId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },
};

// transcribe and extract voice message
export const transcribeAndExtract = {
  fromAudio: async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob);

      // Try OpenAI first
      const openaiRes = await apiClient.post("/api/openai/transcribe", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 25000,
      });

      return openaiRes.data;
    } catch (err: any) {
      console.warn("OpenAI transcription failed:", err?.response?.status);

      // Fallback only for known quota/auth errors
      if (err?.response?.status === 429 || err?.response?.status === 401) {
        console.log("⚡ Switching to AssemblyAI fallback...");

        try {
          const formData = new FormData();
          formData.append("audio", audioBlob);

          const assemblyRes = await apiClient.post(
            "/api/assemblyai/transcribe",
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
              timeout: 30000,
            }
          );

          return assemblyRes.data;
        } catch (fallbackErr) {
          console.error("AssemblyAI also failed:", fallbackErr);
          return {
            success: false,
            message: "All transcription services failed",
          };
        }
      }

      return { success: false, message: "Transcription failed" };
    }
  },
};
