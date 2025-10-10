"use client";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./lib/queryClient";

// Pages
import LoginPage from "@/pages/login/LoginPage";
import NotFound from "@/pages/not-found/not-found";

// Layout & Auth
import PrivateRoute from "@/components/PrivateRouter";
import AppLayout from "@/components/layout/AppLayout";

// Admin pages
import Dashboard from "@/pages/admin/Dashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminUsers from "./pages/admin/AdminUsers";


// Technician pages
import TechnicianDashboard from "@/pages/technician/TechnicianDashboard";

// Staff pages
import StaffPage from "@/pages/staff/StaffPage";
import TicketForm from "./components/ticketsComponents/TicketForm";
import TicketPage from "./pages/ticket-page/TicketPage";
import TechnicianTicketsPage from "./pages/technician/TicketsPage";


export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <Toaster />
          <Routes>
            {/* ---------- Public Route ---------- */}
            <Route path="/" element={<LoginPage />} />

            {/* ---------- Admin Routes ---------- */}
            <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AppLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="tickets" element={<TicketPage />} />
                <Route path="tickets/create" element={<TicketForm />} />
                <Route path="reports" element={<AdminAnalytics />} />

                <Route path="users" element={<AdminUsers />} />
              </Route>
            </Route>

            {/* ---------- Technician Routes ---------- */}
            <Route element={<PrivateRoute allowedRoles={["technician"]} />}>
              <Route path="/technician" element={<AppLayout />}>
                <Route index element={<Navigate to="/technician/dashboard" replace />} />
                <Route path="dashboard" element={<TechnicianDashboard />} />
                <Route path="tickets" element={<TechnicianTicketsPage />} />
              </Route>
            </Route>

           {/* ---------- Staff Routes ---------- */}
          <Route element={<PrivateRoute allowedRoles={["staff"]} />}>
            <Route path="/staff" element={<AppLayout />}>
                <Route index element={<Navigate to="/staff/dashboard" replace />} />
                <Route path="dashboard" element={<StaffPage />} />
                <Route path="tickets/create" element={<TicketForm />} />
                </Route>
          </Route>


            {/* ---------- Fallback ---------- */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
