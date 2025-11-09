import axios, { AxiosHeaders, InternalAxiosRequestConfig } from "axios";

// ----------------------------
// Types
// ----------------------------
export type Role = "admin" | "technician" | "staff";

export interface Branch {
  id: number;
  name: string;
}

export interface Division {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  full_name?: string;
  email: string;
  role: Role;
  branch?: Branch | string | null;
  is_active?: boolean;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export type TicketStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH";

export interface TicketHistoryEntry {
  id: number;
  ticket: number;
  action?: string;
  from_status?: TicketStatus | "";
  to_status?: TicketStatus | "";
  comment?: string;
  changed_by?: number;
  performed_by?: User | null;
  timestamp: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  branch: Branch | string | null;
  division: Division | string | null;
  category?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  file?: string | null;
  created_by?: User | number;
  assigned_to?: User | null;
  created_at: string;
  updated_at: string;
  history?: TicketHistoryEntry[];
}

// ----------------------------
// Axios Instance
// ----------------------------
export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/").replace(/\/?$/, "/"),
  headers: { "Content-Type": "application/json" },
});

// ----------------------------
// Request Interceptor (Attach Token)
// ----------------------------
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken"); 
    if (token) {
      if (!config.headers) config.headers = new AxiosHeaders();
      else config.headers = AxiosHeaders.from(config.headers);
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------------------
// Response Interceptor (Refresh Token)
// ----------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem("refreshToken");

      if (!refresh) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await api.post<{ access: string }>("auth/refresh/", { refresh });
        localStorage.setItem("accessToken", data.access);

        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${data.access}`;
        }
        return api(originalRequest);
      } catch (err) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// ----------------------------
// Auth API
// ----------------------------
export const loginUser = async (payload: LoginPayload): Promise<User> => {
  const { data } = await api.post<LoginResponse>("auth/login/", payload);

  if (!data.access || !data.refresh || !data.user) {
    throw new Error("Login failed");
  }

  //  Save tokens and user in unified keys
  localStorage.setItem("accessToken", data.access);
  localStorage.setItem("refreshToken", data.refresh);
  localStorage.setItem("user", JSON.stringify(data.user));

  return data.user;
};

export const refreshToken = async (): Promise<string | null> => {
  const refresh = localStorage.getItem("refreshToken");
  if (!refresh) return null;
  const { data } = await api.post<{ access: string }>("auth/refresh/", { refresh });
  localStorage.setItem("accessToken", data.access);
  return data.access;
};

// ----------------------------
// Tickets API
// ----------------------------
export const fetchMyTickets = async (): Promise<Ticket[]> => {
  const { data } = await api.get<Ticket[]>("tickets/mine/");
  return data || [];
};

export const fetchAllTickets = async (): Promise<Ticket[]> => {
  const { data } = await api.get<Ticket[]>("tickets/");
  return data || [];
};

export const createTicket = async (ticket: Partial<Ticket> | FormData): Promise<Ticket> => {
  const isFormData = ticket instanceof FormData;
  const { data } = await api.post<Ticket>(
    "tickets/",
    ticket,
    isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
  );
  return data;
};

export const fetchTicketHistory = async (ticketId: number): Promise<TicketHistoryEntry[]> => {
  const { data } = await api.get<TicketHistoryEntry[]>(`tickets/${ticketId}/history/`);
  return data || [];
};

export const updateTicketStatus = async (
  ticketId: number,
  status: TicketStatus,
  note?: string
): Promise<Ticket> => {
  const payload: { status: TicketStatus; note?: string } = { status };
  if (note) payload.note = note;
  const { data } = await api.patch<Ticket>(`tickets/${ticketId}/update_status/`, payload);
  return data;
};

export const assignTicket = async (
  ticketId: number,
  technicianId: number
): Promise<{ message?: string }> => {
  const { data } = await api.post<{ message?: string }>(`tickets/${ticketId}/assign/`, {
    technician_id: technicianId,
  });
  return data;
};

export const fetchTechnicians = async (): Promise<User[]> => {
  const { data } = await api.get<User[]>("users/technicians/");
  return data || [];
};

export const fetchTicketStats = async (): Promise<{
  total: number;
  open: number;
  assigned: number;
  in_progress: number;
  completed: number;
  closed: number;
}> => {
  const { data } = await api.get<{
    total: number;
    open: number;
    assigned: number;
    in_progress: number;
    completed: number;
    closed: number;
  }>("tickets/stats/");
  return data;
};

// ----------------------------
// Divisions API
// ----------------------------
export const fetchDivisions = async (): Promise<Division[]> => {
  const { data } = await api.get<Division[]>("tickets/divisions/");
  return data || [];
};
