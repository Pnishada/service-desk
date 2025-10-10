"use client";

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth, { Role } from "@/hooks/useAuth";

interface PrivateRouteProps {
  allowedRoles?: Role[];
  allowedBranches?: string[];
}

const NotAuthorized: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
    <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
    <p className="text-gray-700 mb-6">You do not have permission to view this page.</p>
    <a href="/" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
      Go to Login
    </a>
  </div>
);

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles, allowedBranches }) => {
  const { user, loading } = useAuth();

  if (loading) return <p className="text-center mt-20">Loading...</p>;
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <NotAuthorized />;

  const userBranch = typeof user.branch === "string" ? user.branch : user.branch?.name ?? null;
  if (allowedBranches && (!userBranch || !allowedBranches.includes(userBranch)))
    return <NotAuthorized />;

  return <Outlet />;
};

export default PrivateRoute;
