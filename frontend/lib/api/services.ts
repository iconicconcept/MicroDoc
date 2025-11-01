import apiClient from "./client";
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

interface LabReportFilters {
  status?: 'pending' | 'completed' | 'cancelled' | 'reviewed';
  testType?: string;
  patientId?: string;
  microbiologistId?: string;
  createdAt?: string;
  updatedAt?: string;
}


interface BurnoutFilters {
  period?: string;
  department?: string;
  userId?: string;
  [key: string]: string | undefined;
}

interface BurnoutTrend {
  date: string;
  stressLevel: number;
  hoursWorked: number;
}

// Auth Services
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post<
      ApiResponse<{ user: User; token: string }>
    >(`/auth/login`, {
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
    >(`/auth/register`, userData);
    // localStorage.setItem("token", response.data.token);
    return response.data;
  },

  getMe: async () => {
    const token = localStorage.getItem("token");
    const response = await apiClient.get<ApiResponse<{ user: User }>>(
      `/auth/me`,
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
      `/auth/profile`,
      profileData
    );
    return response.data;
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(
      `/auth/change-password`,
      passwordData
    );
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/auth/logout`
    );
    return response.data;
  },
};

// Lab Reports Services
export const labReportsApi = {
  getReports: async (
    page: number = 1,
    limit: number = 10,
    filters?: LabReportFilters
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<LabReport>>
    >(`/lab-reports?${params}`);
    return response.data;
  },

  getReportById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<LabReport>>(
      `/lab-reports/${id}`
    );
    return response.data;
  },

  createReport: async (
    reportData: Omit<LabReport, "id" | "createdAt" | "updatedAt">
  ) => {
    const response = await apiClient.post<ApiResponse<LabReport>>(
      `/lab-reports`,
      reportData
    );
    return response.data;
  },

  updateReport: async (id: string, reportData: Partial<LabReport>) => {
    const response = await apiClient.put<ApiResponse<LabReport>>(
      `/lab-reports/${id}`,
      reportData
    );
    return response.data;
  },

  deleteReport: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/lab-reports/${id}`
    );
    return response.data;
  },

  updateStatus: async (
    id: string,
    status: "pending" | "completed" | "cancelled"
  ) => {
    const response = await apiClient.patch<ApiResponse<LabReport>>(
      `/lab-reports/${id}/status`,
      { status }
    );
    return response.data;
  },

  generateAISuggestions: async (id: string) => {
    const response = await apiClient.post<
      ApiResponse<{ suggestions: string[]; report: LabReport }>
    >(`/lab-reports/${id}/ai-suggestions`);
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
    >(`/patients?${params}`);
    return response.data;
  },

  getPatient: (id: string) =>
    apiClient.get<ApiResponse<Patient>>(`/patients/${id}`),

  getPatientById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<Patient>>(
      `/patients/${id}`
    );
    return response.data;
  },

  createPatient: async (
    patientData: Omit<Patient, "id" | "createdAt" | "updatedAt">
  ) => {
    const response = await apiClient.post<ApiResponse<Patient>>(
      `/patients`,
      patientData
    );
    return response.data;
  },

  updatePatient: async (id: string, patientData: Partial<Patient>) => {
    const response = await apiClient.put<ApiResponse<Patient>>(
      `/patients/${id}`,
      patientData
    );
    return response.data;
  },

  deletePatient: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/patients/${id}`
    );
    return response.data;
  },

  searchPatients: async (query: string) => {
    const response = await apiClient.get<
      ApiResponse<{ items: Patient[]; total: number }>
    >(`/patients/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

// Burnout Services
export const burnoutApi = {
  getEntries: async (
    page: number = 1,
    limit: number = 10,
    filters?: BurnoutFilters
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<BurnoutEntry>>
    >(`/burnout?${params}`);
    return response.data;
  },

  createEntry: async (
    entryData: Omit<BurnoutEntry, "id" | "createdAt" | "updatedAt">
  ) => {
    const response = await apiClient.post<ApiResponse<BurnoutEntry>>(
      `/burnout`,
      entryData
    );
    return response.data;
  },

  updateEntry: async (id: string, entryData: Partial<BurnoutEntry>) => {
    const response = await apiClient.put<ApiResponse<BurnoutEntry>>(
      `/burnout/${id}`,
      entryData
    );
    return response.data;
  },

  deleteEntry: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/burnout/${id}`
    );
    return response.data;
  },

  getAnalytics: async (period: string = "month") => {
    const response = await apiClient.get<ApiResponse<BurnoutAnalytics>>(
      `/burnout/analytics?period=${period}`
    );
    return response.data;
  },

  getTrends: async (period: string = "month") => {
    const response = await apiClient.get<
      ApiResponse<{ period: string; trends: BurnoutTrend[]; totalDays: number }>
    >(`/burnout/trends?period=${period}`);
    return response.data;
  },

  getRecommendations: async () => {
    const response = await apiClient.get<
      ApiResponse<{ recommendations: string[] }>
    >(`/burnout/recommendations`);
    return response.data;
  },
};

// Analytics Services
export const analyticsApi = {
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await apiClient.get<ApiResponse<DashboardStats>>(
      `/analytics/dashboard`
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
      `/analytics/clinical?${params}`
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
      `/analytics/lab?${params}`
    );
    return response.data;
  },

  getSystemAnalytics: async (): Promise<ApiResponse<SystemAnalytics>> => {
    const response = await apiClient.get<ApiResponse<SystemAnalytics>>(
      `/analytics/system`
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
    filters?: Record<string, string | number | undefined>
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters || {}),
    });

    const response = await apiClient.get<
      ApiResponse<PaginatedResponse<ClinicalNote>>
    >(`/clinical-notes?${params}`);

    return response.data;
  },

  // Create a new clinical note
  createNote: async (data: Partial<ClinicalNote>) => {
    const response = await apiClient.post("/clinical-notes", data);
    return response.data;
  },

  // Get a note by ID
  getNoteById: async (id: string) => {
    const response = await apiClient.get(`/clinical-notes/${id}`);
    return response.data;
  },

  // Update a note
  updateNote: async (id: string, data: Partial<ClinicalNote>) => {
    const response = await apiClient.put(`/clinical-notes/${id}`, data);
    return response.data;
  },

  // Delete a note
  deleteNote: async (id: string) => {
    const response = await apiClient.delete(`/clinical-notes/${id}`);
    return response.data;
  },

  // Get notes by patient
  getNotesByPatient: async (patientId: string, page = 1, limit = 10) => {
    const response = await apiClient.get(
      `/clinical-notes/patient/${patientId}?page=${page}&limit=${limit}`
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
      const openaiRes = await apiClient.post(
        "/api/openai/transcribe",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 25000,
        }
      );

      return openaiRes.data;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const e = err as { response?: { status?: number } };
        console.warn("OpenAI transcription failed:", e.response?.status);

        if (e.response?.status === 429 || e.response?.status === 401) {
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
      }
    }
  },
};
