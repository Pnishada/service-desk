"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import ProgressTracker from "@/components/ticketsComponents/ProgressTracker";
import TicketHistory from "@/components/ticketsComponents/TicketHistory";
import UpdateStatusModal from "@/components/ticketsComponents/UpdateStatusModal";
import {
  Ticket,
  TicketStatus,
  fetchAllTickets,
  fetchTechnicians,
  assignTicket,
} from "@/api/tickets";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const STATUS_STEPS: TicketStatus[] = ["OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CLOSED"];
const STATUS_COLORS: Record<TicketStatus, string> = {
  OPEN: "#3B82F6",
  ASSIGNED: "#FACC15",
  IN_PROGRESS: "#F87171",
  COMPLETED: "#10B981",
  CLOSED: "#9CA3AF",
};

const displayName = (item: string | { name?: string } | null | undefined) =>
  typeof item === "string" ? item : item?.name || "N/A";

const AdminDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [technicians, setTechnicians] = useState<{ id: number; full_name?: string; username?: string }[]>([]);
  const [assigningTicketId, setAssigningTicketId] = useState<number | null>(null);
  const [selectedTech, setSelectedTech] = useState<Record<number, string>>({});

  // Load tickets and technicians
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [ticketsData, techs] = await Promise.all([fetchAllTickets(), fetchTechnicians()]);
        setTickets(ticketsData);
        setTechnicians(techs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAssign = async (ticketId: number) => {
    const techId = selectedTech[ticketId];
    if (!techId) return;

    setAssigningTicketId(ticketId);
    try {
      await assignTicket(ticketId, parseInt(techId));
      setSelectedTech((prev) => ({ ...prev, [ticketId]: "" }));
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: "ASSIGNED", assigned_to: { id: parseInt(techId) } as any } : t))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to assign technician");
    } finally {
      setAssigningTicketId(null);
    }
  };

  const statusCount = useMemo(
    () =>
      STATUS_STEPS.map((status) => ({
        name: status.replace("_", " "),
        value: tickets.filter((t) => t.status === status).length,
      })),
    [tickets]
  );

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

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
                  <Cell key={index} fill={STATUS_COLORS[STATUS_STEPS[index]]} />
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
                  <Cell key={index} fill={STATUS_COLORS[STATUS_STEPS[index]]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ticket List */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Recent Unassigned Tickets</h2>
        {loading ? (
          <p className="text-gray-500">Loading tickets...</p>
        ) : tickets.filter(t => !t.assigned_to).length === 0 ? (
          <p className="text-gray-500">No unassigned tickets available.</p>
        ) : (
          <ul className="space-y-4 max-h-[700px] overflow-y-auto">
            {tickets
              .filter(ticket => !ticket.assigned_to) // Only unassigned tickets
              .map((ticket) => (
                <li key={ticket.id} className="p-4 border rounded-lg shadow-sm bg-gray-50 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-gray-800">{ticket.title}</h3>
                      <p className="text-sm text-gray-600">{ticket.description}</p>
                      <p className="text-xs text-gray-500">
                        Status: {ticket.status.replace("_", " ")} | Category: {displayName(ticket.category)} | Branch: {displayName(ticket.branch)}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTicketId(ticket.id);
                        setShowUpdateModal(true);
                      }}
                    >
                      Update Status
                    </Button>
                  </div>

                  <ProgressTracker historyStatuses={[ticket.status]} />

                  <div className="flex gap-2 mt-3 items-center">
                    <select
                      className="border p-2 rounded text-sm flex-1"
                      value={selectedTech[ticket.id] || ""}
                      onChange={(e) => setSelectedTech((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                    >
                      <option value="">Select Technician</option>
                      {technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>{tech.full_name || tech.username}</option>
                      ))}
                    </select>
                    <Button size="sm" disabled={assigningTicketId === ticket.id} onClick={() => handleAssign(ticket.id)}>
                      {assigningTicketId === ticket.id ? "Assigning..." : "Assign"}
                    </Button>
                  </div>

                  <div className="mt-3">
                    <TicketHistory ticketId={ticket.id} history={ticket.history} />
                  </div>
                </li>
            ))}
          </ul>
        )}
      </div>

      {selectedTicketId && showUpdateModal && selectedTicket && (
        <UpdateStatusModal
          ticket={selectedTicket!}
          onClose={() => { setShowUpdateModal(false); setSelectedTicketId(null); }}
          onStatusUpdated={(updated) => setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
