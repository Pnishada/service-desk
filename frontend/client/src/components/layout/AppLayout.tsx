"use client";

import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "../appSide-bar/AppSidebar";
import TopNavbar from "../nav-bar/TopNavbar";
// import TicketModal from "../../pages/admin/ticket/TicketModal"; // temporarily removed

export interface User {
  id: string;
  username: string;
  full_name?: string;
  role: "staff" | "admin" | "technician";
  branch?: string | { id: number; name: string } | null;
}

interface AppLayoutProps {
  currentUser?: User;
  pageTitle?: string;
}

export default function AppLayout({
  currentUser,
  pageTitle = "Dashboard",
}: AppLayoutProps) {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile toggle

  //  Default fallback user (if not provided via props)
  const user = currentUser || {
    id: "1",
    username: "johndoe",
    full_name: "John Doe",
    role: "admin" as const,
  };

  const handleTicketClick = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
  };

  const handleTicketUpdate = (ticketId: string, updates: any) => {
    console.log("Ticket updated:", ticketId, updates);
    setIsTicketModalOpen(false);
  };

  const handleSearch = (query: string) => {
    console.log("Global search:", query);
  };

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background">
        {/* Sidebar */}
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top Navbar with currentUser passed in */}
          <TopNavbar
            title={pageTitle}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            currentUser={user}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4">
            <Outlet context={{ onTicketClick: handleTicketClick }} />
          </main>
        </div>

        {/* Temporarily removed TicketModal until it exists */}
        {/*
        <TicketModal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          ticket={selectedTicket}
          userRole={user.role}
          onUpdate={handleTicketUpdate}
        />
        */}
      </div>
    </SidebarProvider>
  );
}
