"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import ProgressTracker, { TicketStatus, STATUS_STEPS } from "@/components/ticketsComponents/ProgressTracker";
import TicketHistory from "@/components/ticketsComponents/TicketHistory";
import UpdateStatusModal from "@/components/ticketsComponents/UpdateStatusModal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { fetchAssignedTickets, fetchTicketHistory, Ticket, TicketHistoryEntry } from "@/api/tickets";

const PIE_COLORS = ["#10B981", "#3B82F6", "#FACC15", "#F87171", "#9CA3AF"];
const REFRESH_INTERVAL = 5000;

const TechnicianDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [historyMap, setHistoryMap] = useState<Record<number, TicketHistoryEntry[]>>({});
  const [expandedTicketIds, setExpandedTicketIds] = useState<Set<number>>(new Set());

  // Load assigned tickets
  const loadTickets = async () => {
    try {
      const data = await fetchAssignedTickets();
      setTickets(data);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load ticket history lazily
  const loadTicketHistory = async (ticketId: number) => {
    if (historyMap[ticketId]) return; // Already loaded
    try {
      const data = await fetchTicketHistory(ticketId);
      setHistoryMap((prev) => ({ ...prev, [ticketId]: data }));
    } catch (err) {
      console.error(`Failed to fetch history for ticket ${ticketId}:`, err);
    }
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(() => {
      if (!selectedTicket) loadTickets(); // Skip refresh while modal open
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [selectedTicket]);

  // Compute ticket status counts
  const statusCount = useMemo(
    () =>
      STATUS_STEPS.map((status) => ({
        name: status.replace("_", " "),
        value: tickets.filter((t) => t.status === status).length,
      })),
    [tickets]
  );

  // Handle status updates from modal
  const handleStatusUpdated = (updatedTicket: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
    loadTicketHistory(updatedTicket.id); // Refresh history
    setSelectedTicket(null);
  };

  // Expand/collapse ticket to load history
  const toggleTicketExpansion = (ticketId: number) => {
    setExpandedTicketIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
        loadTicketHistory(ticketId); // Lazy load history
      }
      return newSet;
    });
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Technician Dashboard</h1>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Tickets by Status</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={statusCount} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value">
                {statusCount.map((entry, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Ticket Distribution</h2>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={statusCount} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {statusCount.map((entry, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ticket List */}
      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
        <h2 className="text-xl font-semibold">My Tickets</h2>
        {loading ? (
          <p className="text-gray-500">Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <p className="text-gray-500">No tickets assigned.</p>
        ) : (
          <ul className="space-y-4 max-h-[600px] overflow-y-auto">
            {tickets.map((ticket) => {
              const isExpanded = expandedTicketIds.has(ticket.id);
              return (
                <li
                  key={ticket.id}
                  className={`p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                    ticket.status === "ASSIGNED" ? "border-blue-500 bg-blue-50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">{ticket.title}</h3>
                      <p className="text-sm text-gray-600">{ticket.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket)}>
                        Update Status
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleTicketExpansion(ticket.id)}>
                        {isExpanded ? "Hide History" : "Show History"}
                      </Button>
                    </div>
                  </div>

                  <ProgressTracker
                    historyStatuses={
                      historyMap[ticket.id]?.map((h) => h.to_status as TicketStatus) || [ticket.status]
                    }
                  />

                  {isExpanded && (
                    <div className="mt-3">
                      <TicketHistory ticketId={ticket.id} history={historyMap[ticket.id]} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Update Status Modal */}
      {selectedTicket && (
        <UpdateStatusModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
};

export default TechnicianDashboard;
