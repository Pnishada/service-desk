"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { fetchBranches, fetchCategories, fetchTechnicians } from "@/api/tickets";
import { useCompletedJobs, CompletedJob } from "@/hooks/useCompletedJobs";
import { fetchTicketStats } from "@/api/ticketStats";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// ---------- TYPES ----------
interface StatsAPI {
  by_status: { status: string; count: number }[];
  by_branch: { branch__name: string; count: number }[];
}

interface Stats {
  status: Record<string, number>;
  branch: Record<string, number>;
}

const COLORS = ["#3B82F6", "#8B5CF6", "#F97316", "#10B981", "#F43F5E"];

interface Filter {
  technician: string;
  branch: string;
  category: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface ReportsProps {
  className?: string;
}

// ---------- COMPONENT ----------
const Reports: React.FC<ReportsProps> = ({ className }) => {
  const [branches, setBranches] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({ status: {}, branch: {} });
  const [filter, setFilter] = useState<Filter>({
    technician: "",
    branch: "",
    category: "",
    startDate: null,
    endDate: null,
  });

  // Convert filter to API params
  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (filter.technician) p.technician = filter.technician;
    if (filter.branch) p.branch = filter.branch;
    if (filter.category) p.category = filter.category;
    if (filter.startDate) p.startDate = filter.startDate.toISOString();
    if (filter.endDate) p.endDate = filter.endDate.toISOString();
    return p;
  }, [filter]);

  // Completed jobs hook
  const { jobs: completedJobs, loading, error, reload, downloadCSV, downloadPDF } =
    useCompletedJobs(params);

  // Load dropdown options
  const loadOptions = useCallback(async () => {
    try {
      const [branchData, categoryData, technicianData] = await Promise.all([
        fetchBranches(),
        fetchCategories(),
        fetchTechnicians(),
      ]);

      setBranches(branchData.map((b: any) => (typeof b === "string" ? b : b.name)));
      setCategories(categoryData.map((c: any) => (typeof c === "string" ? c : c.name)));
      setTechnicians(technicianData.map((t: any) => t.full_name || t.username || "N/A"));
    } catch (err: any) {
      toast.error("Failed to load filter options: " + (err?.message || "Unknown error"));
    }
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const data: StatsAPI = await fetchTicketStats();

      setStats({
        status: Object.fromEntries(data.by_status.map((item) => [item.status, item.count])),
        branch: Object.fromEntries(data.by_branch.map((item) => [item.branch__name, item.count])),
      });
    } catch (err: any) {
      toast.error("Failed to load stats: " + (err?.message || "Unknown error"));
    }
  }, []);

  useEffect(() => {
    loadOptions();
    loadStats();
  }, [loadOptions, loadStats]);

  const handleApplyFilter = () => {
    reload();
    loadStats();
  };

  // Prepare chart data
  const statusData = useMemo(
    () => Object.entries(stats.status).map(([name, count]) => ({ name, count })),
    [stats]
  );

  const branchData = useMemo(
    () => Object.entries(stats.branch).map(([branch, count]) => ({ branch, count })),
    [stats]
  );

  return (
    <div className={className}>
      {/* ===== FILTERS ===== */}
      <div className="flex gap-4 mb-6 flex-wrap items-center">
        <select
          className="input input-bordered"
          value={filter.technician}
          onChange={(e) => setFilter({ ...filter, technician: e.target.value })}
        >
          <option value="">All Technicians</option>
          {technicians.map((tech) => (
            <option key={tech} value={tech}>
              {tech}
            </option>
          ))}
        </select>

        <select
          className="input input-bordered"
          value={filter.branch}
          onChange={(e) => setFilter({ ...filter, branch: e.target.value })}
        >
          <option value="">All Branches</option>
          {branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>

        <select
          className="input input-bordered"
          value={filter.category}
          onChange={(e) => setFilter({ ...filter, category: e.target.value })}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <DatePicker
          selected={filter.startDate}
          onChange={(date) => setFilter({ ...filter, startDate: date })}
          placeholderText="Start Date"
          className="input input-bordered"
          maxDate={filter.endDate || undefined}
        />

        <DatePicker
          selected={filter.endDate}
          onChange={(date) => setFilter({ ...filter, endDate: date })}
          placeholderText="End Date"
          className="input input-bordered"
          minDate={filter.startDate || undefined}
        />

        <Button onClick={handleApplyFilter}>Apply Filter</Button>
        <Button onClick={downloadCSV}>Export CSV</Button>
        <Button onClick={downloadPDF}>Export PDF</Button>
      </div>

      {/* ===== ANALYTICS CHARTS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Ticket Status */}
        <div className="card p-4 shadow">
          <h2 className="text-lg font-semibold mb-2">Ticket Status Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {statusData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Jobs by Branch */}
        <div className="card p-4 shadow">
          <h2 className="text-lg font-semibold mb-2">Completed Jobs by Branch</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={branchData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="branch" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== JOBS TABLE ===== */}
      {loading && <p>Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="overflow-x-auto">
        <table className="table w-full border">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Technician</th>
              <th>Branch</th>
              <th>Category</th>
              <th>Completed At</th>
            </tr>
          </thead>
          <tbody>
            {completedJobs.map((job: CompletedJob) => (
              <tr key={job.id}>
                <td>{job.id}</td>
                <td>{job.title}</td>
                <td>{job.technician.name}</td>
                <td>{job.branch}</td>
                <td>{job.category}</td>
                <td>{job.completed_at ? new Date(job.completed_at).toLocaleString() : "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
