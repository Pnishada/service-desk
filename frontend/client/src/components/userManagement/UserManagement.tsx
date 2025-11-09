"use client";

import { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

import { Plus, Edit, Trash2, Search, Users, Shield, Wrench } from "lucide-react";
import { getUsers, createUser, updateUser, deleteUser, User } from "@/api/axios";

// ----------------------------
// Validation Schema
// ----------------------------
const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  role: z.enum(["staff", "technician", "admin"]),
  status: z.enum(["active", "inactive"]),
});
type UserFormData = z.infer<typeof userFormSchema>;

// ----------------------------
// Extended User Type
// ----------------------------
type UserWithStatus = User & {
  name: string;
  status: "active" | "inactive";
  branch?: string;
};

// ----------------------------
// User Form Dialog Component
// ----------------------------
interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  defaultValues?: UserFormData;
  title: string;
}

const UserFormDialog = ({ isOpen, onClose, onSubmit, defaultValues, title }: UserFormDialogProps) => {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: defaultValues || { name: "", email: "", role: "staff", status: "active" },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
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
                    <Input type="email" {...field} />
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
                  <Select value={field.value} onValueChange={(v) => field.onChange(v as User["role"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
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
                  <Select value={field.value} onValueChange={(v) => field.onChange(v as "active" | "inactive")}>
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
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// ----------------------------
// User Card Component
// ----------------------------
interface UserCardProps {
  user: UserWithStatus;
  onEdit: (user: UserWithStatus) => void;
  onDelete: (id: number) => void;
}

const UserCard = ({ user, onEdit, onDelete }: UserCardProps) => {
  const roleIcons: Record<UserWithStatus["role"], typeof Shield> = {
    admin: Shield,
    technician: Wrench,
    staff: Users,
  };
  const roleColors: Record<UserWithStatus["role"], string> = {
    admin: "bg-red-500",
    technician: "bg-blue-500",
    staff: "bg-green-500",
  };
  const statusColors: Record<UserWithStatus["status"], string> = {
    active: "bg-green-500",
    inactive: "bg-gray-500",
  };
  const RoleIcon = roleIcons[user.role];

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center font-medium">
          {((user.name || user.email || "")
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()) || "U"}
        </div>
        <div>
          <div className="flex gap-2 items-center">
            <p className="font-medium">{user.name}</p>
            <Badge className={`text-white text-xs ${roleColors[user.role]}`}>
              <RoleIcon className="w-3 h-3 mr-1" />
              {user.role}
            </Badge>
            <Badge className={`text-white text-xs ${statusColors[user.status]}`}>{user.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{user.email || "-"}</p>
          {user.branch && <p className="text-xs text-muted-foreground">Branch: {user.branch}</p>}
        </div>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => onEdit(user)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(user.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// ----------------------------
// Main User Management Component
// ----------------------------
export default function UserManagement({ userRole = "admin" }: { userRole?: "admin" }) {
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | User["role"]>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithStatus | null>(null);

  // Load Users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      const mapped: UserWithStatus[] = data.map((u) => ({
        ...u,
        name: u.full_name || u.username || u.email || "Unknown",
        status: u.is_active ? "active" : "inactive",
        branch: typeof u.branch === "string" ? u.branch : u.branch?.name,
      }));
      setUsers(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // CRUD Handlers
  const handleCreateUser = async (data: UserFormData) => {
    try {
      const newUser = await createUser({ ...data, is_active: data.status === "active" });
      setUsers((prev) => [
        ...prev,
        {
          ...newUser,
          name: newUser.full_name || newUser.username || newUser.email || "Unknown",
          status: newUser.is_active ? "active" : "inactive",
          branch: typeof newUser.branch === "string" ? newUser.branch : newUser.branch?.name,
        },
      ]);
      toast.success("User created");
      closeDialog();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create user");
    }
  };

  const handleUpdateUser = async (data: UserFormData) => {
    if (!editingUser) return;
    try {
      const updated = await updateUser(editingUser.id, { ...data, is_active: data.status === "active" });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...updated,
                name: updated.full_name || updated.username || updated.email || "Unknown",
                status: updated.is_active ? "active" : "inactive",
                branch: typeof updated.branch === "string" ? updated.branch : updated.branch?.name,
              }
            : u
        )
      );
      toast.success("User updated");
      closeDialog();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("User deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user");
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  // Filtered Users
  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          ((u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))) &&
          (roleFilter === "all" || u.role === roleFilter) &&
          (statusFilter === "all" || u.status === statusFilter)
      ),
    [users, searchQuery, roleFilter, statusFilter]
  );

  if (userRole !== "admin") {
    return (
      <div className="p-6 text-center">
        <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2>Access Denied</h2>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1>User Management</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search..."
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
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="technician">Technician</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
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
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2" /> No users found
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  onEdit={(user) => {
                    setEditingUser(user);
                    setIsDialogOpen(true);
                  }}
                  onDelete={handleDeleteUser}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      {isDialogOpen && (
        <UserFormDialog
          isOpen={isDialogOpen}
          onClose={closeDialog}
          onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
          defaultValues={
            editingUser
              ? {
                  name: editingUser.name,
                  email: editingUser.email || "",
                  role: editingUser.role,
                  status: editingUser.status,
                }
              : undefined
          }
          title={editingUser ? "Edit User" : "Create New User"}
        />
      )}
    </div>
  );
}
