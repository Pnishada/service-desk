<<<<<<< HEAD
"use client";

import api from "./axios";
import type { User, Branch } from "./axios";

export type TicketStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Category { id: string; name: string; }

export interface TicketHistoryEntry {
  id: number | string;
  ticket: number;
  action?: string;
  from_status?: TicketStatus;
  to_status?: TicketStatus;
  comment?: string;
  performed_by?: User | null;
  changed_by?: number;
  division?: string;
  timestamp: string;
}

export interface Technician {
  id: number;
  username: string;
  full_name?: string;
  email?: string;
  role: string;
}

export interface Division {
  id: number;
  name: string;
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
  created_by?: User | number | null;
  assigned_to?: User | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  history?: TicketHistoryEntry[];
  // Add these
  created_by_name?: string;
  creator_email?: string;
  creator_phone?: string;
}
export interface Notification {
  id: number;
  user: User;
  ticket?: Ticket | null;
  message: string;
  read: boolean;
  created_at: string;
}

// ======================================================
// Tickets API
// ======================================================
export const fetchAllTickets = async (): Promise<Ticket[]> => {
  const { data } = await api.get<Ticket[]>("tickets/");
  return data || [];
};

export const fetchMyTickets = async (): Promise<Ticket[]> => { //new..............
  const { data } = await api.get<Ticket[]>("tickets/mine/");

  // Ensure created_by is always an object or null
  const normalized = (data || []).map((t) => ({
    ...t,
    created_by:
      t.created_by && typeof t.created_by === "object"
        ? t.created_by
        : null,
  }));

  return normalized;
};
export const fetchAssignedTickets = async (): Promise<Ticket[]> => {
  const { data } = await api.get<Ticket[]>("tickets/assigned/");
  return data || [];
};

export const fetchCompletedTickets = async (): Promise<Ticket[]> => {
  const { data } = await api.get<Ticket[]>("tickets/completed/");
  return data || [];
};

// Fetch all technicians
export const fetchTechnicians = async (): Promise<Technician[]> => {
  const { data } = await api.get<Technician[]>("users/technicians/");
  return data || [];
};

export const fetchTicketHistory = async (ticketId: number): Promise<TicketHistoryEntry[]> => {
  const { data } = await api.get<TicketHistoryEntry[]>(`tickets/${ticketId}/history/`);
  return (data || []).map((item: any) => ({
    id: item.id,
    ticket: ticketId,
    action: item.action ?? "",
    comment: item.comment ?? "",
    performed_by: item.performed_by ?? null,
    changed_by: item.performed_by?.id ?? undefined,
    division: item.division ?? undefined,
    timestamp: item.timestamp ?? new Date().toISOString(),
    from_status: item.from_status ?? undefined,
    to_status: item.to_status ?? undefined,
  }));
};

export const fetchTicket = async (ticketId: number): Promise<Ticket> => {
  const { data } = await api.get<Ticket>(`tickets/${ticketId}/`);
  console.log("Fetched Ticket:", data);
  return data;
};

export const createTicket = async (ticketData: Partial<Ticket> | FormData): Promise<Ticket> => {
  const isFormData = ticketData instanceof FormData;
  const { data } = await api.post<Ticket>(
    "tickets/",
    ticketData,
    isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
  );
  return data;
};

export const assignTicket = async (ticketId: number, technicianId: number) => {
  const { data } = await api.post(`tickets/${ticketId}/assign/`, { technician_id: technicianId });
  return data;
};

export const updateTicketStatus = async (ticketId: number, status: TicketStatus, comment?: string): Promise<Ticket> => {
  const payload: any = { status };
  if (comment) payload.comment = comment;
  const { data } = await api.patch<{ ticket: Ticket }>(`tickets/${ticketId}/status/`, payload);
  return data.ticket;
};

// ======================================================
// Divisions, Branches & Categories
// ======================================================
export const fetchDivisions = async (): Promise<Division[]> => {
  const { data } = await api.get<Division[]>("tickets/divisions/");
  return data || [];
};

export const fetchBranches = async (): Promise<Branch[]> => {
  const { data } = await api.get<Branch[]>("tickets/branches/");
  return data || [];
};

export const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await api.get<Category[]>("categories/");
  return data || [];
};

// ======================================================
// Notifications
// ======================================================
export const fetchNotifications = async (): Promise<Notification[]> => {
  const { data } = await api.get<Notification[]>("notifications/");
  return data || [];
};

export const markNotificationAsRead = async (id: number) => {
  const { data } = await api.post(`notifications/${id}/read/`);
  return data;
};

export default api;
=======
"use client";

import api from "./axios";
import type { User, Branch, Division } from "./axios";

export type TicketStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Category { id: string; name: string; }

export interface TicketHistoryEntry {
  id: number | string;
  ticket: number;
  action?: string;
  from_status?: TicketStatus;
  to_status?: TicketStatus;
  comment?: string;
  performed_by?: User | null;
  changed_by?: number;
  division?: string;
  timestamp: string;
}

export interface Technician {
  id: number;
  username: string;
  full_name?: string;
  email?: string;
  role: string;
}

export interface Division {
  id: number;
  name: string;
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
  completed_at?: string | null;
  history?: TicketHistoryEntry[];
  created_by_name?: string;
}

export interface Notification {
  id: number;
  user: User;
  ticket?: Ticket | null;
  message: string;
  read: boolean;
  created_at: string;
}

// ======================================================
// Tickets API
// ======================================================
export const fetchAllTickets = async (): Promise<Ticket[]> => {
  const { data } = await api.get<Ticket[]>("tickets/");
  return data || [];
};

export const fetchMyTickets = async (): Promise<Ticket[]> => {
  const { data } = await api.get<Ticket[]>("tickets/mine/");
  return data || [];
};

export const fetchAssignedTickets = async (): Promise<Ticket[]> => {
  const { data } = await api.get<Ticket[]>("tickets/assigned/");
  return data || [];
};

export const fetchCompletedTickets = async (): Promise<Ticket[]> => {
  const { data } = await api.get<Ticket[]>("tickets/completed/");
  return data || [];
};

// Fetch all technicians
export const fetchTechnicians = async (): Promise<Technician[]> => {
  const { data } = await api.get<Technician[]>("users/technicians/");
  return data || [];
};

export const fetchTicketHistory = async (ticketId: number): Promise<TicketHistoryEntry[]> => {
  const { data } = await api.get<TicketHistoryEntry[]>(`tickets/${ticketId}/history/`);
  return (data || []).map((item: any) => ({
    id: item.id,
    ticket: ticketId,
    action: item.action ?? "",
    comment: item.comment ?? "",
    performed_by: item.performed_by ?? null,
    changed_by: item.performed_by?.id ?? undefined,
    division: item.division ?? undefined,
    timestamp: item.timestamp ?? new Date().toISOString(),
    from_status: item.from_status ?? undefined,
    to_status: item.to_status ?? undefined,
  }));
};

export const fetchTicket = async (ticketId: number): Promise<Ticket> => {
  const { data } = await api.get<Ticket>(`tickets/${ticketId}/`);
  return data;
};

export const createTicket = async (ticketData: Partial<Ticket> | FormData): Promise<Ticket> => {
  const isFormData = ticketData instanceof FormData;
  const { data } = await api.post<Ticket>(
    "tickets/",
    ticketData,
    isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
  );
  return data;
};

export const assignTicket = async (ticketId: number, technicianId: number) => {
  const { data } = await api.post(`tickets/${ticketId}/assign/`, { technician_id: technicianId });
  return data;
};

export const updateTicketStatus = async (ticketId: number, status: TicketStatus, comment?: string): Promise<Ticket> => {
  const payload: any = { status };
  if (comment) payload.comment = comment;
  const { data } = await api.patch<{ ticket: Ticket }>(`tickets/${ticketId}/status/`, payload);
  return data.ticket;
};

// ======================================================
// Divisions, Branches & Categories
// ======================================================
export const fetchDivisions = async (): Promise<Division[]> => {
  const { data } = await api.get<Division[]>("tickets/divisions/");
  return data || [];
};

export const fetchBranches = async (): Promise<Branch[]> => {
  const { data } = await api.get<Branch[]>("tickets/branches/");
  return data || [];
};

export const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await api.get<Category[]>("categories/");
  return data || [];
};

// ======================================================
// Notifications
// ======================================================
export const fetchNotifications = async (): Promise<Notification[]> => {
  const { data } = await api.get<Notification[]>("notifications/");
  return data || [];
};

export const markNotificationAsRead = async (id: number) => {
  const { data } = await api.post(`notifications/${id}/read/`);
  return data;
};

export default api;
>>>>>>> 9437836ac0b130aad4d2919b1c0119b616a68974
