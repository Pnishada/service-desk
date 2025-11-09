"use client";

import api from "./axios";

// -----------------------------
// Stats Interface
// -----------------------------
export interface Stats {
  by_status: { status: string; count: number }[];
  by_priority: { priority: string; count: number }[];
  by_branch: { branch__name: string; count: number }[];
  by_technician: { assigned_to__username: string; count: number }[];
  total_tickets?: number;
  overdue?: number;
}

// -----------------------------
// Completed Jobs Interface
// -----------------------------
export interface CompletedJob {
  id: number;
  title: string;
  assigned_to_name?: string;
  branch_name?: string;
  category_name?: string;
  completed_at?: string;
}

// -----------------------------
// Fetch Ticket Stats
// -----------------------------
export const fetchTicketStats = async (): Promise<Stats> => {
  const { data } = await api.get<Stats>("tickets/stats/");
  return data;
};

// -----------------------------
// Fetch Completed Jobs
// -----------------------------
export const fetchCompletedJobs = async (params?: Record<string, any>): Promise<CompletedJob[]> => {
  const { data } = await api.get("/tickets/completed/", { params });

  return data.map((job: any) => ({
    id: job.id,
    title: job.title,
    assigned_to_name: job.assigned_to_name || job.assigned_to?.full_name || "Unassigned",
    branch_name: job.branch_name || "N/A",
    category_name: job.category_name || "N/A",
    completed_at: job.completed_at,
  }));
};

// -----------------------------
// Export Completed Jobs CSV/PDF
// -----------------------------
export const exportCompletedJobsCSV = async (params?: Record<string, any>): Promise<Blob> => {
  const { data } = await api.get("/tickets/completed/", {
    params: { ...params, export: "csv" },
    responseType: "blob",
  });
  return data;
};

export const exportCompletedJobsPDF = async (params?: Record<string, any>): Promise<Blob> => {
  const { data } = await api.get("/tickets/completed/", {
    params: { ...params, export: "pdf" },
    responseType: "blob",
  });
  return data;
};
