"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ----------------------------
// Types
// ----------------------------
export type Role = "admin" | "technician" | "staff";

export interface StoredUser {
  id: number;
  username: string;
  role: Role;
  full_name?: string;
  branch?: string | { id: number; name: string } | null;
}

export interface Tokens {
  access: string;
  refresh: string;
}

// ----------------------------
// Helpers
// ----------------------------
export const getStoredUser = (): StoredUser | null => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  try {
    const parsed = JSON.parse(userStr);
    const role = parsed.role?.toLowerCase?.() as Role | undefined;

    return {
      id: parsed.id,
      username: parsed.username,
      full_name: parsed.full_name,
      role: role || "staff",
      branch: parsed.branch ?? null,
    };
  } catch (err) {
    console.error("Failed to parse stored user:", err);
    localStorage.removeItem("user");
    return null;
  }
};

// ----------------------------
// Hook
// ----------------------------
export default function useAuth() {
  const [user, setUserState] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) setUserState(storedUser);
    setLoading(false);
  }, []);

  // Set user and tokens
  const setUser = (user: StoredUser | null, tokens?: Tokens) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));

      if (tokens) {
        localStorage.setItem("accessToken", tokens.access);
        localStorage.setItem("refreshToken", tokens.refresh);
      }
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
    setUserState(user);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUserState(null);
    navigate("/"); // Redirect to login page
  };

  const accessToken = localStorage.getItem("accessToken") ?? null;
  const refreshToken = localStorage.getItem("refreshToken") ?? null;

  return { user, setUser, accessToken, refreshToken, loading, logout };
}
