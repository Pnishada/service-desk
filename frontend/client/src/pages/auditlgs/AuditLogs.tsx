import React, { useState } from "react";

interface AuditLogItem {
  id: number;
  user: string;
  action: string;
  ticketId: number;
  timestamp: string; // ISO string
}

const dummyAuditLogs: AuditLogItem[] = [
  {
    id: 1,
    user: "Admin",
    action: "Assigned ticket #101 to Technician A",
    ticketId: 101,
    timestamp: "2025-09-19T10:30:00Z",
  },
  {
    id: 2,
    user: "Technician A",
    action: "Updated ticket #101 status from ASSIGNED → IN_PROGRESS",
    ticketId: 101,
    timestamp: "2025-09-19T11:00:00Z",
  },
  {
    id: 3,
    user: "Technician A",
    action: "Marked ticket #101 as COMPLETED",
    ticketId: 101,
    timestamp: "2025-09-19T13:45:00Z",
  },
  {
    id: 4,
    user: "Admin",
    action: "Created new ticket #102",
    ticketId: 102,
    timestamp: "2025-09-19T14:10:00Z",
  },
];

const AuditLogs: React.FC = () => {
  const [logs] = useState<AuditLogItem[]>(dummyAuditLogs);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Audit Logs</h1>

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticket ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {log.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {log.user}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{log.action}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {log.ticketId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;
