"use client";

import api from "./axios";
import type { Ticket, TicketStatus } from "./tickets";

// ==============================
// Fetch tickets assigned to the logged-in technician
// ==============================
export const fetchAssignedTickets = async (): Promise<Ticket[]> => {
  const { data } = await api.get<Ticket[]>("/tickets/assigned/");
  return data || [];
};

// ==============================
// Update ticket status (with optional note)
// ==============================
export const updateTicketStatus = async (ticketId: number, status: TicketStatus, note?: string): Promise<Ticket> => {
  const payload: any = { status };
  if (note) payload.note = note;

  const { data } = await api.patch<{ ticket: Ticket }>(`/tickets/${ticketId}/status/`, payload);
  return data.ticket;
};
