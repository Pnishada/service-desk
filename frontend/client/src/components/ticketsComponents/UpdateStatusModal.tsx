"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Ticket, TicketStatus, updateTicketStatus, TicketHistoryEntry } from "@/api/tickets";

interface Props {
  ticket: Ticket;
  onClose: () => void;
  onStatusUpdated: (updatedTicket: Ticket, newHistoryEntry?: TicketHistoryEntry) => void;
  allowComment?: boolean;
}

const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CLOSED", label: "Closed" },
];

const UpdateStatusModal: React.FC<Props> = ({ ticket, onClose, onStatusUpdated, allowComment = false }) => {
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const statusRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    statusRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleUpdate = async () => {
    if (!status) return toast.error("Please select a status");

    const hasStatusChanged = status !== ticket.status;
    const hasComment = comment.trim().length > 0;

    if (!hasStatusChanged && !hasComment && !allowComment) {
      return toast.error("No changes to update");
    }

    try {
      setLoading(true);
      const updatedTicket = await updateTicketStatus(ticket.id, status, comment.trim());

      const newHistoryEntry: TicketHistoryEntry = {
        id: Date.now(),
        ticket: ticket.id,
        from_status: ticket.status,
        to_status: status,
        comment: comment.trim() || undefined,
        timestamp: new Date().toISOString(),
        performed_by: JSON.parse(localStorage.getItem("user") || "{}"),
      };

      onStatusUpdated(updatedTicket, newHistoryEntry);
      toast.success("Ticket status updated!");
      setComment("");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data ? JSON.stringify(err.response.data) : "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Update Ticket Status</h2>

        <label htmlFor="status-select" className="block text-sm font-medium mb-1">
          Select Status
        </label>
        <select
          ref={statusRef}
          id="status-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as TicketStatus)}
          className="w-full mb-4 p-2 border rounded focus:ring focus:ring-blue-300"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional comment..."
          className="w-full border p-2 rounded mb-4 resize-none focus:ring focus:ring-blue-300"
          rows={3}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || (!allowComment && status === ticket.status && !comment.trim())}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateStatusModal;
