"use client";

import { Outlet } from "react-router-dom";
import AppSidebar from "../appSide-bar/AppSidebar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main content */}
      <main className="flex-1 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
