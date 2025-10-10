import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const ticketsPerDay = [
  { day: "Mon", tickets: 12 },
  { day: "Tue", tickets: 18 },
  { day: "Wed", tickets: 10 },
  { day: "Thu", tickets: 24 },
  { day: "Fri", tickets: 16 },
  { day: "Sat", tickets: 8 },
  { day: "Sun", tickets: 5 },
];

const completedVsPending = [
  { name: "Completed", value: 40 },
  { name: "Pending", value: 20 },
];

const COLORS = ["#4ade80", "#f87171"]; // green, red

const Monitoring: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Monitoring Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Line Chart – Tickets per Day */}
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Tickets Per Day</h2>
          <LineChart width={400} height={250} data={ticketsPerDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="tickets" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </div>

        {/* Pie Chart – Completed vs Pending */}
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Completed vs Pending Tickets</h2>
          <PieChart width={400} height={250}>
            <Pie
              data={completedVsPending}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {completedVsPending.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" />
          </PieChart>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
