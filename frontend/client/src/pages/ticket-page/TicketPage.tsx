"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllTickets, type Ticket, type TicketStatus } from "@/api/tickets";
import UpdateStatusModal from "@/components/ticketsComponents/UpdateStatusModal";
import TicketDetailsModal from "@/components/ticketsComponents/TicketDetailsModel";

const statusColors: Record<TicketStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-700",
};

export default function TicketPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [updateStatusId, setUpdateStatusId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [role, setRole] = useState<string>("");

  const queryClient = useQueryClient();

  // Load role from localStorage
  useEffect(() => {
    const storedRole = localStorage.getItem("currentRole");
    setRole(storedRole ? storedRole.trim().toLowerCase() : "staff");
  }, []);

  const canUpdateStatusOrComment = role === "technician" || role === "admin";

  // Fetch tickets
  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: fetchAllTickets,
    enabled: role !== "",
  });

  const filteredTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.title.toLowerCase().includes(search.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, search, statusFilter]);

  const selectedUpdateTicket = tickets?.find((t) => t.id === updateStatusId) || null;

  if (!role || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Tickets</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center">
        <input
          type="text"
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded-lg w-full sm:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TicketStatus | "ALL")}
          className="border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Ticket List */}
      {filteredTickets.length === 0 && <p>No tickets found.</p>}

      <div className="grid gap-4">
        {filteredTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="p-4 border rounded-lg shadow hover:shadow-lg transition flex justify-between items-center"
          >
            <div>
              <h2 className="font-semibold text-lg">{ticket.title}</h2>
              <p className="text-gray-600">{ticket.description?.slice(0, 80)}...</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium">Status:</span>
                <span
                  className={`px-2 py-1 text-xs rounded-full font-semibold ${
                    statusColors[ticket.status ?? "OPEN"]
                  }`}
                >
                  {(ticket.status ?? "OPEN").replace("_", " ")}
                </span>
              </div>
              {ticket.assigned_to && (
                <p className="text-gray-500 text-sm mt-1">
                  Assigned to: {ticket.assigned_to.username}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setSelectedTicketId(ticket.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                View Details
              </button>

              {canUpdateStatusOrComment && ticket.status !== "CLOSED" && (
                <button
                  onClick={() => setUpdateStatusId(ticket.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition"
                >
                  Update Status / Comment
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicketId && (
        <TicketDetailsModal
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />
      )}

      {/* Update Status Modal */}
      {selectedUpdateTicket && (
        <UpdateStatusModal
          ticket={selectedUpdateTicket}
          onClose={() => setUpdateStatusId(null)}
          onStatusUpdated={(updatedTicket) => {
            if (!tickets) return;
            queryClient.setQueryData<Ticket[]>(["tickets"], (old) =>
              old?.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)) || []
            );
          }}
          allowComment={canUpdateStatusOrComment}
        />
      )}
    </div>
  );
}
