"use client";

import type { Ticket, TicketStatus } from "@/api/tickets";
import type { Division } from "@/api/axios";

interface Props {
  ticket: Ticket;
  onSelect: (ticket: Ticket) => void;
  onStatusUpdated?: (updatedTicket: Ticket) => void;
}

export default function TicketCard({ ticket, onSelect, onStatusUpdated }: Props) {
  const handleStatusChange = (newStatus: TicketStatus) => {
    const updatedTicket: Ticket = { ...ticket, status: newStatus };
    onStatusUpdated?.(updatedTicket);
  };

  const getDivisionName = (division?: Division | string | null) => {
    if (!division) return "N/A";
    return typeof division === "string" ? division : division.name || "N/A";
  };

  const creator = ticket.created_by && typeof ticket.created_by === "object" ? ticket.created_by : null;

  const getCreatorName = () => creator?.full_name || creator?.username || ticket.full_name || "N/A";
  const getCreatorEmail = () => creator?.email || ticket.email || "N/A";
  const getCreatorPhone = () => creator?.phone || ticket.phone || "N/A";

  return (
    <div
      className="bg-white p-4 rounded shadow flex flex-col justify-between cursor-pointer hover:shadow-md"
      onClick={() => onSelect(ticket)}
    >
      <div>
        {/* Ticket Title */}
        <h3 className="font-semibold text-gray-800">{ticket.title}</h3>

        {/* Ticket Description */}
        <p className="text-sm text-gray-600 mt-1">
          {ticket.description?.length > 120
            ? `${ticket.description.slice(0, 120)}...`
            : ticket.description}
        </p>

        {/* Created By Section */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm text-sm space-y-2">
          <h4 className="font-semibold text-gray-700 mb-1">Created By</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">👤</span>
              <span className="text-gray-800 font-medium">{getCreatorName()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">🏢</span>
              <span className="text-gray-800 font-medium">{getDivisionName(ticket.division)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">📞</span>
              <span className="text-gray-800 font-medium">{getCreatorPhone()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-500">📧</span>
            <span className="text-gray-800 font-medium">{getCreatorEmail()}</span>
          </div>
        </div>

        {/* Status & Priority */}
        <div className="mt-2 flex gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-gray-100">{ticket.status}</span>
          <span className="px-2 py-1 rounded bg-gray-50">{ticket.priority ?? "MEDIUM"}</span>
        </div>

        {/* Attached File */}
        {ticket.file && (
          <div className="mt-2">
            <a
              href={ticket.file}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline text-sm"
            >
              📎 View attached file
            </a>
          </div>
        )}
      </div>

      {/* Status Update Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleStatusChange("COMPLETED");
        }}
        className="mt-4 text-blue-600 text-sm underline"
      >
        Mark as Resolved
      </button>
    </div>
  );
}
