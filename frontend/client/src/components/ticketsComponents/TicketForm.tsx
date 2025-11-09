"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import {
  createTicket,
  fetchBranches,
  fetchDivisions,
  fetchCategories,
  TicketPriority,
} from "@/api/tickets";

interface Option {
  id: number | string;
  name: string;
}

const CreateTicket: React.FC = () => {
  const navigate = useNavigate();

  // ----------------------------
  // Form Fields
  // ----------------------------
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [branch, setBranch] = useState<string>("");
  const [division, setDivision] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<TicketPriority>("LOW");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // ----------------------------
  // Loading and Dropdown Data
  // ----------------------------
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState<Option[]>([]);
  const [divisions, setDivisions] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);

  // ----------------------------
  // Fetch dropdown data
  // ----------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        const [branchData, divisionData, categoryData] = await Promise.all([
          fetchBranches(),
          fetchDivisions(),
          fetchCategories(),
        ]);

        // Ensure only id and name are used
        const clean = (arr: any[]) => arr.map((item) => ({ id: item.id, name: item.name }));

        setBranches(clean(branchData));
        setDivisions(clean(divisionData));
        setCategories(clean(categoryData));
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        toast.error("Failed to load form data. Please refresh the page.");
      }
    };

    loadData();
  }, []);

  // ----------------------------
  // Form Submission
  // ----------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("branch", branch);
      formData.append("division", division);
      formData.append("category", category);
      formData.append("priority", priority);
      formData.append("full_name", fullName);
      formData.append("email", email);
      formData.append("phone", phone);
      if (file) formData.append("file", file);

      await createTicket(formData);
      toast.success("Ticket created successfully!");
      navigate("/staff/dashboard");
    } catch (err) {
      console.error("Ticket creation failed:", err);
      toast.error("Failed to create ticket. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-6">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
        Create New Ticket
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            rows={5}
            required
          />
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            required
          >
            <option value="">Select Branch</option>
            {branches.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            required
          >
            <option value="">Select Division</option>
            {divisions.map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            required
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          {/* <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          >
            <option value="LOW">Low Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="HIGH">High Priority</option>
          </select> */}

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="p-2 border rounded-lg"
          />

          <button
            type="submit"
            disabled={isLoading}
            className={`bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors mt-auto flex justify-center items-center gap-2 ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isLoading && <Loader2 className="animate-spin h-5 w-5" />}
            {isLoading ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTicket;
