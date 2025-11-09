"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchNotifications,
  markNotificationRead,
  Notification,
} from "@/api/notifications";
import TicketDetailsModal from "../ticketsComponents/TicketDetailsModel";


export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);

  // Load notifications from API
  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  // Mark as read + open ticket modal
  const handleOpenTicket = async (n: Notification) => {
    try {
      await markNotificationRead(n.id);
      setSelectedTicket(n.ticket); // show ticket modal
      loadNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      {/* Bell Icon */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto border rounded-lg bg-white shadow-lg z-50">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 border-b cursor-pointer transition-colors ${
                  n.read
                    ? "bg-gray-50 hover:bg-gray-100"
                    : "bg-blue-50 hover:bg-blue-100"
                }`}
                onClick={() => handleOpenTicket(n)}
              >
                <p className="font-medium">{n.ticket_title}</p>
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Ticket Modal */}
      {selectedTicket && (
        <TicketDetailsModal
          ticketId={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}
