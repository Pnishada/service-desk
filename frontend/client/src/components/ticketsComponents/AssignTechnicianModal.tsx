"use client";

import api from "@/api/axios";
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface Props {
  ticketId: number;
  onClose: () => void;
  onAssigned: () => void;
}

interface Technician {
  id: number;
  email: string;
  full_name: string;
}

const AssignTechnicianModal: React.FC<Props> = ({ ticketId, onClose, onAssigned }) => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTech, setSelectedTech] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch all technicians on mount
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const { data } = await api.get<Technician[]>("/users/?role=TECHNICIAN");
        setTechnicians(data);
      } catch (error) {
        toast.error("Failed to fetch technicians");
        console.error(error);
      }
    };
    fetchTechnicians();
  }, []);

  // Handle assigning technician
  const handleAssign = async () => {
    if (!selectedTech) {
      toast.error("Please select a technician");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/tickets/${ticketId}/assign/`, { technician_id: selectedTech });
      toast.success("Technician assigned successfully");
      onAssigned();
      onClose();
    } catch (error) {
      toast.error("Failed to assign technician");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-lg font-bold mb-4">Assign Technician</h2>

        <select
          className="w-full border p-2 rounded mb-4"
          value={selectedTech ?? ""}
          onChange={(e) => setSelectedTech(Number(e.target.value))}
        >
          <option value="">Select technician</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.full_name} ({tech.email})
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

export default AssignTechnicianModal;
