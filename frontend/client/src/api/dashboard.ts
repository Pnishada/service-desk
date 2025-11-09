import api from "./axios";

export const fetchStats = async () => {
  const { data } = await api.get("/tickets/stats");
  return data;
};

export const fetchRecentTickets = async () => {
  const { data } = await api.get("/tickets/recent");
  return data;
};

export const fetchCompletedJobs = async () => {
  const { data } = await api.get("/reports/completed");
  return data;
};

// Add these two
export const fetchPerformanceData = async () => {
  const { data } = await api.get("/reports/performance");
  return data;
};

export const fetchTechnicianStats = async () => {
  const { data } = await api.get("/reports/technicians");
  return data;
};
