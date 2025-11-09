"use client";

import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "../appSide-bar/AppSidebar";
import TopNavbar from "../nav-bar/TopNavbar";
import useAuth from "@/hooks/useAuth";

export default function AppLayout({ pageTitle = "Dashboard" }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

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
          {/* Top Navbar */}
          <TopNavbar
            title={pageTitle}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            currentUser={user}
          />

          {/* Main content */}
          <main className="flex-1 overflow-auto p-4">
            <Outlet /> {/* Nested route pages render here */}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
