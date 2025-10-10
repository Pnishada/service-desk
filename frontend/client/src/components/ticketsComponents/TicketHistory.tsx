"use client";

import React, { useEffect, useState } from "react";
import ProgressTracker, { TicketStatus } from "./ProgressTracker";
import { fetchTicketHistory, TicketHistoryEntry } from "@/api/tickets";

interface Props {
  ticketId?: number;
  history?: TicketHistoryEntry[];
  userMap?: Record<number, string>;
}

const TicketHistory: React.FC<Props> = ({ ticketId, history: propHistory, userMap }) => {
  const [history, setHistory] = useState<TicketHistoryEntry[]>(propHistory ?? []);
  const [loading, setLoading] = useState(!propHistory);

  useEffect(() => {
    if (propHistory || !ticketId) return;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const data = await fetchTicketHistory(ticketId);
        setHistory(data ?? []);
      } catch (err) {
        console.error("Failed to fetch ticket history:", err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [ticketId, propHistory]);

  const getStatusesUpTo = (index: number): TicketStatus[] => {
    const statuses: TicketStatus[] = [];
    for (let i = 0; i <= index; i++) {
      const s = history[i].to_status as TicketStatus | undefined;
      if (s && !statuses.includes(s)) statuses.push(s);
    }
    if (!statuses.includes("OPEN")) statuses.unshift("OPEN");
    return statuses;
  };

  if (loading) return <p className="text-gray-500 italic">Loading history...</p>;
  if (!history.length) return <p className="text-gray-500 italic">No history available.</p>;

  return (
    <ul className="space-y-4">
      {history.map((item, index) => {
        const user =
          item.performed_by?.id != null
            ? userMap?.[item.performed_by.id] || item.performed_by.full_name || `User #${item.performed_by.id}`
            : "System";

        const formattedTime = new Date(item.timestamp).toLocaleString();
        const completedStatuses = getStatusesUpTo(index);

        return (
          <li
            key={item.id}
            className="flex flex-col p-3 border rounded-md bg-gray-50 hover:bg-gray-100 transition"
          >
            <ProgressTracker historyStatuses={completedStatuses} />

            <div className="flex justify-between items-start mt-2">
              <div className="flex-1 space-y-1">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Changed by:</span> {user}
                </div>

                {item.comment && (
                  <div className="text-gray-600 italic bg-gray-100 p-2 rounded mt-1">
                    💬 {item.comment}
                  </div>
                )}
              </div>
              <div className="text-gray-400 text-xs ml-4">{formattedTime}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default TicketHistory;
