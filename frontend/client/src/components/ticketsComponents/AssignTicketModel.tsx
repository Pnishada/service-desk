"use client";

import React, { useState, useEffect } from "react";
import api from "@/api/axios";
import { assignTicket } from "@/api/tickets";
import { toast } from "react-hot-toast";

interface Props {
  ticketId: number;
  onClose: () => void;
  onAssigned: () => void;
}

interface Technician {
  id: number;
  username: string;
  email: string;
}

const AssignTicketModal: React.FC<Props> = ({ ticketId, onClose, onAssigned }) => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTech, setSelectedTech] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  // Fetch technicians on mount
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const res = await api.get<Technician[]>("/users/?role=technician");
        setTechnicians(res.data);
      } catch (err) {
        console.error("Failed to fetch technicians:", err);
        toast.error("Failed to load technicians.");
      }
    };
    fetchTechnicians();
  }, []);

  const handleAssign = async () => {
    if (!selectedTech) {
      toast.error("Please select a technician.");
      return;
    }

    try {
      setLoading(true);
      await assignTicket(ticketId, selectedTech as number);
      toast.success("Ticket assigned successfully!");
      onAssigned();
      onClose();
    } catch (err) {
      console.error("Assign ticket failed:", err);
      toast.error("Failed to assign ticket. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4">Assign Ticket</h3>

        <select
          id="technician-select"
          value={selectedTech}
          onChange={(e) => setSelectedTech(Number(e.target.value))}
          className="w-full border rounded p-2 mb-4 focus:ring focus:ring-blue-300"
        >
          <option value="">Select Technician</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.username} ({tech.email})
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignTicketModal;
