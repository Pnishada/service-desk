"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useCompletedJobs, CompletedJob } from "@/hooks/useCompletedJobs";
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
  LineChart,
  Line,
} from "recharts";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fetchBranches, fetchCategories, fetchTechnicians } from "@/api/tickets";
import { fetchTicketStats, Stats } from "@/api/ticketStats";

// ---------- CONSTANTS ----------
const COLORS = ["#3B82F6", "#F97316", "#10B981", "#8B5CF6", "#F43F5E"];

interface Filter {
  technician: string;
  branch: string;
  category: string;
  startDate: Date | null;
  endDate: Date | null;
}

// ---------- COMPONENT ----------
const AdminAnalytics: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [trendRange, setTrendRange] = useState<number>(7);

  const [filter, setFilter] = useState<Filter>({
    technician: "",
    branch: "",
    category: "",
    startDate: null,
    endDate: null,
  });

  // Load dropdown options
  const loadDropdowns = useCallback(async () => {
    try {
      const [techs, brs, cats] = await Promise.all([
        fetchTechnicians(),
        fetchBranches(),
        fetchCategories(),
      ]);

      setTechnicians(techs.map((t) => (typeof t === "string" ? t : t.full_name || t.username || "N/A")));
      setBranches(brs.map((b) => (typeof b === "string" ? b : b.name)));
      setCategories(cats.map((c) => (typeof c === "string" ? c : c.name)));
    } catch (err: any) {
      toast.error("Failed to load dropdown data: " + (err?.message || "Unknown error"));
    }
  }, []);

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
  const { jobs: completedJobs, loading: loadingJobs, error, reload, downloadCSV, downloadPDF } =
    useCompletedJobs(params);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const data = await fetchTicketStats();
      setStats(data);
    } catch (err: any) {
      toast.error("Failed to load stats: " + (err?.message || "Unknown error"));
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDropdowns();
    loadStats();
  }, [loadDropdowns, loadStats]);

  // Apply filter
  const handleApplyFilter = () => {
    reload();
    loadStats();
  };

  // -------------------------
  // Chart Data
  // -------------------------
  const statusData = useMemo(
    () => stats?.by_status.map((s) => ({ name: s.status, value: s.count })) || [],
    [stats]
  );

  const priorityData = useMemo(
    () => stats?.by_priority.map((p) => ({ name: p.priority, value: p.count })) || [],
    [stats]
  );

  const trendData = useMemo(() => {
    if (!completedJobs.length) return [];
    const trendMap: Record<string, number> = {};
    const now = new Date();
    const startDate = new Date(now.getTime() - trendRange * 24 * 60 * 60 * 1000);

    completedJobs.forEach((job: CompletedJob) => {
      if (!job.completed_at) return;
      const jobDate = new Date(job.completed_at);
      if (jobDate >= startDate) {
        const day = jobDate.toISOString().slice(0, 10);
        trendMap[day] = (trendMap[day] || 0) + 1;
      }
    });

    return Object.entries(trendMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [completedJobs, trendRange]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Analytics Dashboard</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
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

        <select
          className="input input-bordered"
          value={trendRange}
          onChange={(e) => setTrendRange(Number(e.target.value))}
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={90}>Last 90 Days</option>
        </select>

        <Button onClick={handleApplyFilter}>Apply Filter</Button>
        <Button onClick={downloadCSV}>Export CSV</Button>
        <Button onClick={downloadPDF}>Export PDF</Button>
      </div>

      {(loadingStats || loadingJobs) && <p>Loading data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Tickets by Status */}
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Tickets by Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
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

        {/* Tickets by Priority */}
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Tickets by Priority</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value">
                {priorityData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Completed Tickets Trend */}
        <div className="p-4 border rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Completed Tickets Trend ({trendRange} Days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3B82F6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Completed Jobs Table */}
      <div className="overflow-x-auto border rounded shadow">
        <table className="table w-full">
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

export default AdminAnalytics;
