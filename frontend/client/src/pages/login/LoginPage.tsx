"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import useAuth from "@/hooks/useAuth";
import { loginUser } from "@/api/axios";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect already logged-in users
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
        navigate("/", { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user: loggedUser, token } = await loginUser({ username, password });

      // ✅ Only set user & navigate if login is successful
      setUser(loggedUser, token);

      // Store tokens in localStorage here safely
      localStorage.setItem("accessToken", token.access);
      localStorage.setItem("refreshToken", token.refresh);
      localStorage.setItem("user", JSON.stringify(loggedUser));

      toast.success("Login successful!");
      redirectByRole(loggedUser.role);
    } catch (err: any) {
      // Show error message and stay on the login page
      const msg = err.message || "Invalid username or password.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-tr from-[#0f172a] via-[#1e293b] to-[#0f172a]">
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 100, -100, 0], y: [0, 80, -80, 0] }}
          transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
          className="absolute w-72 h-72 bg-blue-500/30 rounded-full blur-3xl top-10 left-10"
        />
        <motion.div
          animate={{ x: [0, -80, 120, 0], y: [0, 100, -50, 0] }}
          transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
          className="absolute w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl bottom-20 right-10"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          className="absolute w-64 h-64 bg-purple-500/20 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2"
        />
      </div>

      {/* Login Card */}
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
          <AnimatePresence>
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: [0, -6, 6, -6, 6, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="text-red-400 text-center text-sm font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Username */}
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

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 text-white/60 w-5 h-5" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full bg-white/20 text-white placeholder-white/70 border border-white/30 rounded-lg py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-white/70 hover:text-white transition"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Login Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2.5 rounded-lg shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </motion.button>
        </form>

        <p className="text-center text-white/60 text-xs mt-6">
          © {new Date().getFullYear()} ServiceDesk. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
