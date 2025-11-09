"use client";

import React, { useEffect, useState } from "react";
import { Bell, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import useAuth from "@/hooks/useAuth";
import { fetchNotifications, markNotificationRead, Notification } from "@/api/notifications";
import ProfilePage from "../Profile_View/ProfilePage";
import { User as LayoutUser } from "../layout/AppLayout"; // AppLayout User type
import { User as APIUser } from "@/api/axios"; // API User type

interface TopNavbarProps {
  title?: string;
  onMenuToggle?: () => void;
  currentUser?: LayoutUser;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ title = "Dashboard", onMenuToggle, currentUser }) => {
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Convert LayoutUser to APIUser safely
  const apiUser: APIUser | undefined = currentUser
    ? {
        id: Number(currentUser.id),
        username: currentUser.username,
        full_name: currentUser.full_name || currentUser.username,
        email: "", // fallback since LayoutUser has no email
        role: currentUser.role as APIUser["role"],
        branch:
          currentUser.branch && typeof currentUser.branch === "object"
            ? currentUser.branch.name
            : currentUser.branch || null,
        is_active: true,
      }
    : undefined;

  // Fetch notifications
  const fetchNotificationsData = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      fetchNotificationsData();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  useEffect(() => {
    fetchNotificationsData();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  return (
    <>
      {/* Navbar */}
      <div className="w-full flex justify-between items-center bg-white shadow-md px-4 py-3">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <Menu
              className="text-gray-700 cursor-pointer lg:hidden"
              size={24}
              onClick={onMenuToggle}
            />
          )}
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 relative">
          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative"
            >
              <Bell className="text-gray-700" size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50"
                >
                  <div className="p-3 border-b bg-gray-50 font-semibold text-gray-700">
                    Notifications
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`p-3 cursor-pointer border-b last:border-b-0 transition-all hover:bg-gray-50 ${
                            !notif.read ? "bg-blue-50" : "bg-white"
                          }`}
                        >
                          <p className="text-gray-800 text-sm font-medium">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User/Profile */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <User className="text-gray-700" size={22} />
            </Button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-2xl shadow-xl z-50"
                >
                  {/* User Info */}
                  <div className="flex flex-col items-center gap-2 p-4 border-b">
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-700">
                      {currentUser?.full_name?.[0] || currentUser?.username?.[0] || "A"}
                    </div>
                    <p className="font-semibold text-gray-800">
                      {currentUser?.full_name || currentUser?.username}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {currentUser?.role}
                    </p>
                    <p className="text-xs text-gray-500">
                      Branch:{" "}
                      {currentUser?.branch
                        ? typeof currentUser.branch === "string"
                          ? currentUser.branch
                          : currentUser.branch.name
                        : "N/A"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col">
                    <button
                      onClick={() => {
                        setProfileOpen(true);
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfilePage
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        currentUser={apiUser}
      />
    </>
  );
};

export default TopNavbar;
