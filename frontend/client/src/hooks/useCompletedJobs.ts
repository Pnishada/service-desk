"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CompletedJob as ApiCompletedJob,
  fetchCompletedJobs,
  exportCompletedJobsCSV,
  exportCompletedJobsPDF,
} from "@/api/ticketStats";

// -------------------------
// Frontend CompletedJob type
// -------------------------
export interface CompletedJob {
  id: number;
  title: string;
  completed_at?: string;
  technician: { name: string };
  branch: string;
  category: string;
}

interface UseCompletedJobsParams {
  technician?: string;
  branch?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

// -------------------------
// Custom Hook
// -------------------------
export const useCompletedJobs = (params?: UseCompletedJobsParams) => {
  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // Load Completed Jobs
  // -------------------------
  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data: ApiCompletedJob[] = await fetchCompletedJobs(params);

      const mappedData: CompletedJob[] = data.map((job) => ({
        id: job.id,
        title: job.title || "N/A",
        completed_at: job.completed_at,
        technician: { name: job.assigned_to_name || "N/A" },
        branch: job.branch_name || "N/A",
        category: job.category_name || "N/A",
      }));

      setJobs(mappedData);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch completed jobs");
    } finally {
      setLoading(false);
    }
  }, [params]);

  // -------------------------
  // Download Helpers
  // -------------------------
  const downloadCSV = useCallback(async () => {
    try {
      const blob = await exportCompletedJobsCSV(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `completed_jobs_${new Date().toISOString()}.csv`;
      a.click();
      a.remove();
    } catch (err) {
      console.error("CSV export failed", err);
    }
  }, [params]);

  const downloadPDF = useCallback(async () => {
    try {
      const blob = await exportCompletedJobsPDF(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `completed_jobs_${new Date().toISOString()}.pdf`;
      a.click();
      a.remove();
    } catch (err) {
      console.error("PDF export failed", err);
    }
  }, [params]);

  // -------------------------
  // Initial Load
  // -------------------------
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  return {
    jobs,
    loading,
    error,
    reload: loadJobs,
    downloadCSV,
    downloadPDF,
  };
};
