<<<<<<< HEAD
import type { Ticket, TicketStatus, Division } from "@/api/tickets";

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

   // Helper to safely get division name
    const getDivisionName = (division?: Division | string | null) => {
    if (!division) return "N/A";
    if (typeof division === "string") return division;
    return division.name || "N/A";
  };

  const getCreatorName = () => {
    if (typeof ticket.created_by === "object" && ticket.created_by) {
      return ticket.created_by.full_name || ticket.created_by.username;
    }
    return ticket.full_name || "N/A";
  };

  const getCreatorEmail = () => {
    if (typeof ticket.created_by === "object" && ticket.created_by) {
      return ticket.created_by.email || "N/A";
    }
    return ticket.email || "N/A";
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

           {/* Created By Section */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm text-sm space-y-1">
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
          </div>
        </div>

        </div>

        <div className="mt-2 flex gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-gray-100">{ticket.status}</span>
          <span className="px-2 py-1 rounded bg-gray-50">{ticket.priority ?? "MEDIUM"}</span>
        </div>

           <div className="mt-2 text-sm space-y-1">
         


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
=======
import type { Ticket, TicketStatus, Division } from "@/api/tickets";

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

   // Helper to safely get division name
  const getDivisionName = (division?: Division | string | null) => {
    if (!division) return "N/A";
    return typeof division === "string" ? division : division.name;
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

           <div className="mt-2 text-sm space-y-1">
          <p>
            <strong>Division:</strong> {getDivisionName(ticket.division)}
          </p>
          <p>
            <strong>Created By:</strong> {ticket.created_by_name || "N/A"}
          </p>
          <p>
            <strong>Phone:</strong> {ticket.phone || "N/A"}
          </p>
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
>>>>>>> 9437836ac0b130aad4d2919b1c0119b616a68974
