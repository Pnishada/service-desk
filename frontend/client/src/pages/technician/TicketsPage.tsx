"use client";

import React, { useState, useMemo, useEffect } from "react";
import { fetchAssignedTickets, Ticket, TicketStatus } from "@/api/tickets";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import TicketDetailsModal from "@/components/ticketsComponents/TicketDetailsModel";
import UpdateStatusModal from "@/components/ticketsComponents/UpdateStatusModal";

const statusColors: Record<TicketStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-700",
};

const TechnicianTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [updateStatusId, setUpdateStatusId] = useState<number | null>(null);
  const [role, setRole] = useState<string>("");

  // Load role
  useEffect(() => {
    const storedRole = localStorage.getItem("currentRole");
    if (storedRole) {
      setRole(storedRole.trim().toLowerCase());
    } else {
      console.warn("No role found in localStorage");
      setRole("technician"); // fallback to technician for testing
    }
  }, []);

  const canUpdateStatus = role === "technician" || role === "admin";

  // Fetch tickets
  useEffect(() => {
    const loadTickets = async () => {
      setLoading(true);
      try {
        const data = await fetchAssignedTickets();
        console.log("Fetched tickets:", data);
        setTickets(data);
      } catch (err) {
        console.error("Error fetching tickets:", err);
        toast.error("Failed to fetch tickets");
      } finally {
        setLoading(false);
      }
    };
    loadTickets();
  }, []);

  const filteredTickets = useMemo(
    () =>
      tickets.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
      ),
    [tickets, search]
  );

  // Show loader while fetching role or tickets
  if (!role || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-gray-600" size={48} />
      </div>
    );
  }

  const selectedUpdateTicket = tickets.find((t) => t.id === updateStatusId) || null;

  return (
    <div className="p-4 flex flex-col items-center gap-4">
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search your tickets..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-3 rounded-lg w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
      />

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4 w-full">
        {filteredTickets.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center">No tickets found.</p>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicketId(ticket.id)}
              className="cursor-pointer w-full border rounded-xl p-4 bg-white hover:shadow-lg transition transform hover:-translate-y-1 duration-200"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800 text-lg truncate">{ticket.title}</h3>
                <Badge className={statusColors[ticket.status]}>{ticket.status.replace("_", " ")}</Badge>
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{ticket.description}</p>
              <div className="flex justify-between items-center">
                {canUpdateStatus && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUpdateStatusId(ticket.id);
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition"
                  >
                    Update Status
                  </button>
                )}
                <span className="text-gray-400 text-xs">
                  Assigned to: {ticket.assigned_to?.username || "Unassigned"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicketId && (
        <TicketDetailsModal ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />
      )}

      {/* Update Status Modal */}
      {selectedUpdateTicket && (
        <UpdateStatusModal
          ticket={selectedUpdateTicket}
          onClose={() => setUpdateStatusId(null)}
          onStatusUpdated={(updatedTicket) => {
            setTickets((prev) =>
              prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
            );
            setUpdateStatusId(null);
          }}
        />
      )}
    </div>
  );
};

export default TechnicianTicketsPage;
