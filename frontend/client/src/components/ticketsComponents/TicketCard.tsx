import type { Ticket, TicketStatus } from "@/api/tickets";

interface Props {
  ticket: Ticket;
  onSelect: (ticket: Ticket) => void;
  onStatusUpdated?: (updatedTicket: Ticket) => void; // Optional callback
}

export default function TicketCard({ ticket, onSelect, onStatusUpdated }: Props) {
  const handleStatusChange = (newStatus: TicketStatus) => {
    const updatedTicket: Ticket = { ...ticket, status: newStatus };
    onStatusUpdated?.(updatedTicket); // Call callback if provided
  };

  return (
    <div
      className="bg-white p-4 rounded shadow flex flex-col justify-between cursor-pointer hover:shadow-md"
      onClick={() => onSelect(ticket)}
    >
      <div>
        <h3 className="font-semibold">{ticket.title}</h3>
        <p className="text-sm text-gray-600 mt-1">
          {ticket.description.length > 120
            ? ticket.description.slice(0, 120) + "..."
            : ticket.description}
        </p>

        <div className="mt-2 flex gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-gray-100">{ticket.status}</span>
          <span className="px-2 py-1 rounded bg-gray-50">{ticket.priority ?? "MEDIUM"}</span>
        </div>

        {/* Example button to simulate status update */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleStatusChange("RESOLVED" as TicketStatus); 
          }}
          className="mt-2 text-blue-600 text-sm underline"
        >
          Mark as Resolved
        </button>

        {/* File Link */}
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
    </div>
  );
}
