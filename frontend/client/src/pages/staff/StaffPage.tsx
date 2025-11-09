"use client";

import React, { useEffect, useState } from "react";
import {
  fetchMyTickets,
  fetchTicketHistory,
  Ticket,
  TicketHistoryEntry,
} from "@/api/tickets";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

// ====================== Colors ======================
const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-500",
  ASSIGNED: "bg-yellow-400",
  IN_PROGRESS: "bg-orange-500",
  COMPLETED: "bg-green-500",
  CLOSED: "bg-red-500",
};

// ====================== Ticket Cards CreatedByInfo (compact) ======================
interface CreatedByInfoProps {
  created_by_name?: string;
  division?: { name?: string } | string | null;
}

const CreatedByInfoCard: React.FC<CreatedByInfoProps> = ({
  created_by_name,
  division,
}) => {
  const getDivisionName = () => {
    if (!division) return "N/A";
    if (typeof division === "string") return division;
    return division.name || "N/A";
  };

  return (
    <div className="mt-4 p-2 bg-gray-50 rounded-lg shadow-sm border border-gray-200 text-sm">
      <div className="flex flex-col gap-1">
        <span className="text-gray-800 font-medium">👤 {created_by_name ?? "Unknown"}</span>
        <span className="text-gray-600">🏢 {getDivisionName()}</span>
      </div>
    </div>
  );
};

// ====================== StaffDashboard Component ======================
const StaffDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [ticketHistory, setTicketHistory] = useState<TicketHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const data = await fetchMyTickets();
        setTickets(data);
        setFilteredTickets(data);
      } catch (err) {
        console.error("Error fetching tickets:", err);
      } finally {
        setLoading(false);
      }
    };
    loadTickets();
  }, []);

  // Filter tickets
  useEffect(() => {
    let temp = [...tickets];
    if (statusFilter !== "ALL") temp = temp.filter((t) => t.status === statusFilter);
    if (priorityFilter !== "ALL") temp = temp.filter((t) => t.priority === priorityFilter);
    if (searchQuery.trim() !== "")
      temp = temp.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      );
    setFilteredTickets(temp);
  }, [statusFilter, priorityFilter, searchQuery, tickets]);

  // Load ticket history when a ticket is selected
  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedTicket) return;
      setHistoryLoading(true);
      try {
        const history = await fetchTicketHistory(selectedTicket.id);
        setTicketHistory(history);
      } catch (err) {
        console.error("Error fetching ticket history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, [selectedTicket]);

  // ====================== Chart Data ======================
  const statusSummary = filteredTickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusSummary).map(([name, value]) => ({ name, value }));

  const barData = Array.from(
    filteredTickets.reduce<Map<string, number>>((map, t) => {
      const date = t.created_at.split("T")[0];
      map.set(date, (map.get(date) || 0) + 1);
      return map;
    }, new Map())
  ).map(([name, count]) => ({ name, count }));

  // ====================== Render ======================
  if (loading)
    return <div className="p-6 text-center text-gray-500 text-lg">Loading tickets...</div>;

  if (!tickets.length)
    return <div className="p-6 text-center text-gray-500 text-lg">No tickets found.</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">My Dashboard</h1>

      {/* === Filters === */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Search by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border rounded-md shadow-sm flex-1 focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-400"
        >
          <option value="ALL">All Statuses</option>
          {Object.keys(STATUS_COLORS).map((status) => (
            <option key={status} value={status}>
              {status.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-400"
        >
          <option value="ALL">All Priorities</option>
          {["LOW", "MEDIUM", "HIGH"].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* === Ticket Cards === */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTickets.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-lg shadow-md p-5 hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setSelectedTicket(t)}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-lg text-gray-800">{t.title}</h3>
              <span
                className={`px-2 py-1 text-xs rounded-full font-semibold text-white ${
                  STATUS_COLORS[t.status]
                }`}
              >
                {t.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
              {t.description || "No description provided."}
            </p>

            {/* Compact Created By Info for Card */}
            <CreatedByInfoCard created_by_name={t.created_by_name} division={t.division} />

            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Priority: {t.priority ?? "MEDIUM"}</span>
              <span>{new Date(t.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* === Ticket Modal with Full Created By === */}
      {selectedTicket && (
        <>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative overflow-y-auto max-h-[90vh]">
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setTicketHistory([]);
                }}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold mb-2 text-gray-800">{selectedTicket.title}</h2>
              <p className="text-gray-600 mb-4">
                {selectedTicket.description || "No description."}
              </p>

              {/* Ticket Info */}
              <div className="space-y-2 text-sm mb-4">
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-semibold text-white ${
                      STATUS_COLORS[selectedTicket.status]
                    }`}
                  >
                    {selectedTicket.status.replace("_", " ")}
                  </span>
                </p>
                <p>
                  <strong>Priority:</strong> {selectedTicket.priority ?? "MEDIUM"}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(selectedTicket.created_at).toLocaleString()}
                </p>
                {selectedTicket.updated_at && (
                  <p>
                    <strong>Updated:</strong>{" "}
                    {new Date(selectedTicket.updated_at).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Full Created By Section */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm text-sm space-y-1">
                <h4 className="font-semibold text-gray-700 mb-1">Created By</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">👤</span>
                    <span className="text-gray-800 font-medium">{selectedTicket.created_by_name ?? "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📧</span>
                    <span className="text-gray-800 font-medium">{selectedTicket.creator_email ?? "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📞</span>
                    <span className="text-gray-800 font-medium">{selectedTicket.creator_phone ?? "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">🏢</span>
                    <span className="text-gray-800 font-medium">
                      {typeof selectedTicket.division === "string"
                        ? selectedTicket.division
                        : selectedTicket.division?.name ?? "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technician Updates */}
              <div className="mt-4">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Technician Updates & Comments
                </h3>
                {historyLoading ? (
                  <p className="text-sm text-gray-500 italic">Loading updates...</p>
                ) : ticketHistory.length > 0 ? (
                  <ul className="space-y-3">
                    {ticketHistory.map((h) => (
                      <li
                        key={h.id}
                        className="bg-gray-50 p-3 rounded-md border border-gray-200 text-sm"
                      >
                        <div className="flex justify-between items-center">
                          <span>
                            <strong>{h.performed_by?.full_name ?? "Technician"}</strong>{" "}
                            changed status from{" "}
                            <span className="font-medium text-gray-700">
                              {h.from_status || "N/A"}
                            </span>{" "}
                            →{" "}
                            <span className="font-medium text-gray-700">
                              {h.to_status || "N/A"}
                            </span>
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(h.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {h.comment && (
                          <p className="mt-1 text-gray-700 italic">💬 {h.comment}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No technician updates yet.</p>
                )}
              </div>

              {/* Attachment */}
              {selectedTicket.file && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Attachment:</h3>
                  {selectedTicket.file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img
                      src={selectedTicket.file}
                      alt="Attachment"
                      className="max-w-full h-auto rounded-md shadow-sm cursor-pointer"
                      onClick={() => setLightboxImage(selectedTicket.file as string)}
                    />
                  ) : (
                    <a
                      href={selectedTicket.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedTicket.file.split("/").pop()}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lightbox */}
          {lightboxImage && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4 cursor-pointer"
              onClick={() => setLightboxImage(null)}
            >
              <img
                src={lightboxImage}
                alt="Preview"
                className="max-h-full max-w-full rounded-lg shadow-lg"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StaffDashboard;
