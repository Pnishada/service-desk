"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import useAuth from "@/hooks/useAuth";
import { loginUser } from "@/api/axios";
import { motion } from "framer-motion";
import { Lock, User } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) redirectByRole(user.role);
  }, [user]);

  const redirectByRole = (role: string) => {
    switch (role) {
      case "admin":
        navigate("/admin/dashboard", { replace: true });
        break;
      case "technician":
        navigate("/technician/dashboard", { replace: true });
        break;
      case "staff":
        navigate("/staff/dashboard", { replace: true });
        break;
      default:
        navigate("/login", { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user: loggedUser, token } = await loginUser({ username, password });
      setUser(loggedUser, token);
      toast.success("Login successful!");
      redirectByRole(loggedUser.role);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Invalid username or password.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-tr from-[#0f172a] via-[#1e293b] to-[#0f172a]">
      {/* === Background Animated Elements === */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, -100, 0],
            y: [0, 80, -80, 0],
          }}
          transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
          className="absolute w-72 h-72 bg-blue-500/30 rounded-full blur-3xl top-10 left-10"
        />
        <motion.div
          animate={{
            x: [0, -80, 120, 0],
            y: [0, 100, -50, 0],
          }}
          transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
          className="absolute w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl bottom-20 right-10"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          className="absolute w-64 h-64 bg-purple-500/20 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2"
        />
      </div>

      {/* === Login Card === */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-8"
      >
        <div className="text-center mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-white drop-shadow-lg"
          >
            ServiceDesk Portal
          </motion.h1>
          <p className="text-white/70 mt-2 text-sm">Log in to access your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-300 text-center text-sm">
              {error}
            </motion.p>
          )}

          <div className="relative">
            <User className="absolute left-3 top-2.5 text-white/60 w-5 h-5" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              className="w-full bg-white/20 text-white placeholder-white/70 border border-white/30 rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-2.5 text-white/60 w-5 h-5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full bg-white/20 text-white placeholder-white/70 border border-white/30 rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2.5 rounded-lg shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </motion.button>
        </form>

        <p className="text-center text-white/60 text-xs mt-6">
          © {new Date().getFullYear()} ServiceDesk. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
