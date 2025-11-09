import TicketCard from "./TicketCard";
import type { Ticket } from "@/api/tickets";

interface Props {
  tickets: Ticket[];
  onSelect: (ticket: Ticket) => void;
  onTicketUpdated?: (updatedTicket: Ticket) => void;
}

export default function TicketList({ tickets, onSelect, onTicketUpdated }: Props) {
  if (tickets.length === 0) return <div>No tickets assigned.</div>;

  const handleTicketUpdate = (updatedTicket: Ticket) => {
    onTicketUpdated?.(updatedTicket);
  };

  return (
    <div className="grid gap-4">
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          onSelect={onSelect}
          onStatusUpdated={handleTicketUpdate} // Now valid
        />
      ))}
    </div>
  );
}
