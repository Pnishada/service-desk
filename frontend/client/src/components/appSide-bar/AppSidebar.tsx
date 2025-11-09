"use client";

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  Plus,
  BarChart3,
  Users,
  LogOut,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

interface AppSidebarProps {
  isOpen: boolean;           
  onClose: () => void;       
}

const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  // -----------------------------
  // Menu Items Based on Role
  // -----------------------------
  const menuItems = [
    {
      title: "Dashboard",
      url:
        user.role === "admin"
          ? "/admin/dashboard"
          : user.role === "technician"
          ? "/technician/dashboard"
          : "/staff/dashboard",
      icon: LayoutDashboard,
    },
    ...(user.role === "staff"
      ? [
          { title: "Create Ticket", url: "/staff/tickets/create", icon: Plus },
        ]
      : []),
    ...(user.role === "admin"
      ? [
          { title: "Tickets", url: "/admin/tickets", icon: Ticket },
          { title: "Users", url: "/admin/users", icon: Users },
          { title: "Reports", url: "/admin/reports", icon: BarChart3 },
        ]
      : []),
    ...(user.role === "technician"
      ? [{ title: "Tickets", url: "/technician/tickets", icon: Ticket }]
      : []),
  ];

  // -----------------------------
  // Logout Handler
  // -----------------------------
  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Sidebar */}
      <AnimatePresence>
        {(isOpen || typeof window !== "undefined") && (
          <motion.aside
            key="sidebar"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`fixed lg:static top-0 left-0 z-50 h-full w-64 bg-white shadow-md border-r border-gray-200 flex flex-col ${
              isOpen ? "block" : "hidden lg:flex"
            }`}
          >
            {/* Header */}
            <div className="hidden lg:flex items-center justify-center h-20 border-b border-gray-200">
              <h1 className="text-xl font-bold text-blue-700">
                {user.role === "admin"
                  ? "Admin Portal"
                  : user.role === "technician"
                  ? "Technician Portal"
                  : "Staff Portal"}
              </h1>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">{user.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              {user.branch && (
                <Badge className="mt-2 text-xs bg-blue-100 text-blue-700">
                  {typeof user.branch === "string" ? user.branch : user.branch.name ?? "N/A"}
                </Badge>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
              {menuItems.map(({ title, url, icon: Icon }) => (
                <NavLink
                  key={title}
                  to={url}
                  onClick={onClose} // close sidebar on mobile
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-100 text-blue-700 font-semibold"
                        : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {title}
                </NavLink>
              ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-100">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-center gap-2 text-gray-700 hover:text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 lg:hidden z-40"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default AppSidebar;
