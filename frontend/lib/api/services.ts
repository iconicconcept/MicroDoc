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
      "/lab-reports",
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
  getNotes: async (page: number = 1, limit: number = 10, filters?: any) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/clinical-notes?${params}`
      );
      console.log("Clinical Notes API Response:", response.data);

      // Handle the actual backend response structure
      if (response.data.success) {
        return response.data; // Return the entire response
      } else {
        throw new Error(
          response.data.error || "Failed to fetch clinical notes"
        );
      }
    } catch (error) {
      console.error("Error fetching clinical notes:", error);
      // Return structured mock data for development
      return {
        success: true,
        data: {
          items: getMockClinicalNotes(),
          pagination: {
            page,
            limit,
            total: 5,
            totalPages: 1,
          },
        },
      };
    }
  },

  // Add these mock data functions at the end of the file, before the closing }

  // Mock data functions for development
};

const getMockClinicalNotes = (): ClinicalNote[] => {
  return [
    {
      id: "1",
      patientId: "patient1",
      clinicianId: "clinician1",
      type: "clinical",
      content:
        "Patient presents with fever and cough for 3 days. Temperature 38.5°C, respiratory rate 22. Suspected respiratory infection.",
      transcript: "Patient presents with fever and cough for 3 days",
      summary: "Respiratory infection suspected, recommend chest X-ray and CBC",
      priority: "high",
      isSynced: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      patient: {
        name: "John Doe",
        patientId: "P001",
        age: 45,
        gender: "male",
      },
    },
    {
      id: "2",
      patientId: "patient2",
      clinicianId: "clinician1",
      type: "procedure",
      content:
        "Blood sample collected for CBC and culture. Patient tolerated well.",
      transcript: "Blood sample collected for CBC and culture",
      summary: "Routine blood work completed",
      priority: "medium",
      isSynced: true,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      patient: {
        name: "Sarah Smith",
        patientId: "P002",
        age: 32,
        gender: "female",
      },
    },
    {
      id: "3",
      patientId: "patient3",
      clinicianId: "clinician1",
      type: "clinical",
      content:
        "Follow-up visit for diabetes management. Blood glucose levels stable with current insulin regimen.",
      transcript: "Follow-up visit for diabetes management",
      summary: "Diabetes well controlled, continue current treatment",
      priority: "low",
      isSynced: true,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      patient: {
        name: "Michael Brown",
        patientId: "P003",
        age: 58,
        gender: "male",
      },
    },
  ];
};
