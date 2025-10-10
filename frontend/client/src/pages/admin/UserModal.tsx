"use client";

import React, { useState, useEffect } from "react";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void; // Refresh list after saving
  user?: any; // If provided, this modal is "Edit"
}

export default function UserModal({ isOpen, onClose, onSaved, user }: Props) {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "TECHNICIAN" | "STAFF">("STAFF");
  const [branch, setBranch] = useState("");
  const [password, setPassword] = useState(""); // Only for create
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setFullName(user.full_name);
      setEmail(user.email || "");
      setRole(user.role);
      setBranch(user.branch || "");
      setPassword("");
    } else {
      setUsername("");
      setFullName("");
      setEmail("");
      setRole("STAFF");
      setBranch("");
      setPassword("");
    }
  }, [user]);

  const handleSave = async () => {
    if (!username || !fullName || !role) return alert("Please fill all required fields");

    try {
      setLoading(true);
      if (user) {
        // Edit user
        await api.put(`/users/${user.id}/`, { username, full_name: fullName, email, role, branch });
      } else {
        // Create user
        await api.post("/users/", { username, full_name: fullName, email, role, branch, password });
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{user ? "Edit User" : "Create User"}</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />
        {!user && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-2 p-2 border rounded"
          />
        )}

        {/* Role select with accessible label */}
        <label htmlFor="role-select" className="block mb-1 font-medium">
          Role
        </label>
        <select
          id="role-select"
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="w-full mb-2 p-2 border rounded"
        >
          <option value="ADMIN">Admin</option>
          <option value="TECHNICIAN">Technician</option>
          <option value="STAFF">Staff</option>
        </select>

        <input
          type="text"
          placeholder="Branch (optional)"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />

        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={loading} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
