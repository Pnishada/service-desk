"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import api, { User } from "@/api/axios";

interface ProfilePageProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
}

export default function ProfilePage({
  isOpen,
  onClose,
  currentUser,
}: ProfilePageProps) {
  const navigate = useNavigate();

  const [username, setUsername] = useState(currentUser?.full_name || currentUser?.username || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null); // store File
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); // for preview

  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.full_name || currentUser.username);
      setEmail(currentUser.email || "");
    }
  }, [currentUser]);

  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Send verification code via API
  const sendVerificationCode = async () => {
    try {
      setLoading(true);
      const res = await api.post("/auth/send-verification-code/", { email });
      setIsVerifying(true);
      alert(`Verification code sent to ${email}: ${res.data.message}`);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Verify code & update profile via API
  const handleVerifyCode = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("username", username);
      formData.append("email", email);
      if (password) formData.append("password", password);
      if (avatar) formData.append("avatar", avatar); // send File
      formData.append("verification_code", verificationCode);

      await api.put(`/users/${currentUser?.id}/update-profile/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Profile updated successfully!");
      setIsVerifying(false);
      setVerificationCode("");
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
        </DialogHeader>

        {!isVerifying ? (
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-24 w-24">
                {avatarPreview ? <img src={avatarPreview} alt="avatar" /> : username[0]}
              </Avatar>
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                Upload Avatar
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex flex-col">
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <div className="flex flex-col">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="flex flex-col">
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-2">
            <Label>Enter verification code sent to your email:</Label>
            <Input
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
          </div>
        )}

        <DialogFooter className="flex justify-between mt-4">
          <Button variant="destructive" onClick={handleLogout} disabled={loading}>
            Log Out
          </Button>
          {!isVerifying ? (
            <Button onClick={sendVerificationCode} disabled={loading}>
              {loading ? "Sending..." : "Save Changes"}
            </Button>
          ) : (
            <Button onClick={handleVerifyCode} disabled={loading}>
              {loading ? "Verifying..." : "Verify Code"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
