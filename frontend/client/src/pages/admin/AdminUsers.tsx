"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { Plus, Users, Search } from "lucide-react"; // <-- Added Search
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import api from "@/api/axios";

// ----------------------------
// Types
// ----------------------------
export type UserRole = "ADMIN" | "TECHNICIAN" | "STAFF";
export type UserStatus = "active" | "inactive";

export interface User {
  id: number;
  username?: string | null;
  full_name?: string | null;
  email?: string | null;
  role: UserRole;
  branch?: string | null;
  is_active: boolean;
}

// ----------------------------
// Form Validation
// ----------------------------
const userFormSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  role: z.enum(["ADMIN", "TECHNICIAN", "STAFF"]),
  status: z.enum(["active", "inactive"]),
});
type UserFormData = z.infer<typeof userFormSchema>;

// ----------------------------
// User Modal
// ----------------------------
interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  user?: User | null;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSaved, user }) => {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: user
      ? {
          full_name: user.full_name ?? "",
          email: user.email ?? "",
          role: user.role,
          status: user.is_active ? "active" : "inactive",
        }
      : { full_name: "", email: "", role: "STAFF", status: "active" },
  });

  const handleSubmit = async (data: UserFormData) => {
    try {
      if (user) {
        await api.put(`/users/${user.id}/`, {
          ...data,
          is_active: data.status === "active",
        });
        toast.success("User updated successfully");
      } else {
        await api.post("/users/", {
          ...data,
          is_active: data.status === "active",
        });
        toast.success("User created successfully");
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save user");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Create New User"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              name="full_name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="role"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="TECHNICIAN">Technician</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="status"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={(v) => field.onChange(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{user ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// ----------------------------
// Admin Users Component
// ----------------------------
export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<User[]>("/users/");
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${id}/`);
      toast.success("User deleted");
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user");
    }
  };

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          ((u.full_name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.email ?? "").toLowerCase().includes(searchQuery.toLowerCase())) &&
          (roleFilter === "all" || u.role === roleFilter) &&
          (statusFilter === "all" || (u.is_active ? "active" : "inactive") === statusFilter)
      ),
    [users, searchQuery, roleFilter, statusFilter]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <Button
          onClick={() => {
            setSelectedUser(null);
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-10"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="TECHNICIAN">Technician</SelectItem>
            <SelectItem value="STAFF">Staff</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Table */}
      {loading ? (
        <p>Loading users...</p>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2" /> No users found
        </div>
      ) : (
        <table className="w-full border-collapse bg-white shadow rounded">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border">ID</th>
              <th className="p-3 border">Username</th>
              <th className="p-3 border">Full Name</th>
              <th className="p-3 border">Role</th>
              <th className="p-3 border">Branch</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="p-3 border">{u.id}</td>
                <td className="p-3 border">{u.username ?? "-"}</td>
                <td className="p-3 border">{u.full_name ?? "-"}</td>
                <td className="p-3 border">{u.role}</td>
                <td className="p-3 border">{u.branch ?? "-"}</td>
                <td className="p-3 border">
                  <Badge
                    className={`text-xs ${u.is_active ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}
                  >
                    {u.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="p-3 border flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedUser(u);
                      setModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(u.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* User Modal */}
      <UserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchUsers}
        user={selectedUser}
      />
    </div>
  );
}
