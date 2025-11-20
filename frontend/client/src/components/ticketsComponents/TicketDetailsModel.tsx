"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTicket,
  Ticket,
  TicketHistoryEntry,
  TicketStatus,
} from "@/api/tickets";
import TicketHistory from "@/components/ticketsComponents/TicketHistory";
import UpdateStatusModal from "@/components/ticketsComponents/UpdateStatusModal";
import { Division } from "@/api/axios";

interface Props {
  ticketId: number;
  onClose: () => void;
}

type Tab = "description" | "attachments" | "history";

const statusStyles: Record<TicketStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  ASSIGNED: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-700",
};

export default function TicketDetailsModal({ ticketId, onClose }: Props) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("description");

  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = (localStorage.getItem("currentRole") || "").trim().toLowerCase();
  const canUpdateStatusOrComment = ["technician", "admin"].includes(role);

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ["ticket", ticketId],
    queryFn: () => fetchTicket(ticketId),
    enabled: !!ticketId,
  });

  const handleStatusUpdated = (updatedTicket: Ticket, newHistoryEntry?: TicketHistoryEntry) => {
    queryClient.setQueryData<Ticket>(["ticket", ticketId], (old) => {
      if (!old) return updatedTicket;
      return {
        ...updatedTicket,
        history: newHistoryEntry ? [...(old.history || []), newHistoryEntry] : old.history,
      };
    });
    setShowUpdateModal(false);
  };

  const handleAddComment = () => {
    if (!ticket || !commentInput.trim()) return;

    const newHistory: TicketHistoryEntry = {
      id: Date.now(),
      ticket: ticket.id,
      from_status: ticket.status ?? "OPEN",
      to_status: ticket.status ?? "OPEN",
      comment: commentInput.trim(),
      timestamp: new Date().toISOString(),
      performed_by: user,
    };

    queryClient.setQueryData<Ticket>(["ticket", ticketId], (old) => {
      if (!old) return ticket;
      return { ...old, history: [...(old.history || []), newHistory] };
    });

    setCommentInput("");
  };

  if (isLoading || !ticket) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 animate-fadeIn">
          <p className="text-gray-500 text-center">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  const createdBy = typeof ticket.created_by === "object" && ticket.created_by ? ticket.created_by : null;
  const creatorName = createdBy
    ? `${createdBy.full_name || createdBy.username} (${createdBy.email})`
    : `${ticket.full_name || "Unknown"} (${ticket.email || "N/A"})`;
  const creatorEmail = createdBy?.email || ticket.email || "N/A";
  const creatorPhone = createdBy?.phone || ticket.phone || "N/A";

  const tabs: Tab[] = ["description", "attachments", "history"];
  const getTabClass = (tab: Tab) =>
    activeTab === tab
      ? "border-b-2 border-blue-600 text-blue-600"
      : "text-gray-500 hover:text-gray-700 transition";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">{ticket.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-bold">×</button>
        </div>

        {/* Update Status / Comment */}
        {canUpdateStatusOrComment && (
          <div className="flex justify-end p-4 border-b">
            <button
              onClick={() => setShowUpdateModal(true)}
              disabled={ticket.status === "CLOSED"}
              className={`px-4 py-2 rounded-lg text-white transition ${
                ticket.status === "CLOSED"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Update Status / Comment
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b px-6 mt-4">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 px-4 font-medium ${getTabClass(tab)}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className="font-medium text-gray-700">Status:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[ticket.status ?? "OPEN"]}`}>
              {(ticket.status ?? "OPEN").replace("_", " ")}
            </span>
          </div>

          {/* Created By */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Created By</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">👤</span>
                <span className="text-gray-800 font-medium">{creatorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">📧</span>
                <span className="text-gray-800 font-medium">{creatorEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">📞</span>
                <span className="text-gray-800 font-medium">{creatorPhone}</span>
              </div>
              {ticket.division && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">🏢</span>
                  <span className="text-gray-800 font-medium">
                    {typeof ticket.division === "object" ? ticket.division.name : ticket.division}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Assigned To */}
          {ticket.assigned_to && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="font-medium text-gray-700">Assigned to:</span>
              <span className="text-gray-800">
                {ticket.assigned_to.username} ({ticket.assigned_to.email})
              </span>
            </div>
          )}

          {/* Tabs Content */}
          {activeTab === "description" && ticket.description && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600">{ticket.description}</p>
            </div>
          )}

          {activeTab === "attachments" && ticket.file && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Attachment</h3>
              {ticket.file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img
                  src={ticket.file}
                  alt="Attachment"
                  className="w-40 h-40 object-cover cursor-pointer rounded-lg border shadow-sm"
                  onClick={() => setLightboxImage(ticket.file!)}
                />
              ) : (
                <a
                  href={ticket.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  Download File
                </a>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Ticket History</h3>
              <TicketHistory ticketId={ticket.id} history={ticket.history ?? []} userMap={{}} />
            </div>
          )}
        </div>

        {/* Add Comment */}
        {canUpdateStatusOrComment && (
          <div className="sticky bottom-0 bg-white p-4 border-t flex gap-2">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className="border p-2 rounded flex-1 focus:ring-2 focus:ring-blue-400 outline-none"
            />
            <button
              onClick={handleAddComment}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Attachment"
            className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateModal && ticket && (
        <UpdateStatusModal
          ticket={ticket}
          onClose={() => setShowUpdateModal(false)}
          onStatusUpdated={handleStatusUpdated}
          allowComment={canUpdateStatusOrComment}
        />
      )}
    </div>
  );
}
