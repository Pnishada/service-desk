"use client";

import React from "react";

export const STATUS_STEPS = ["OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CLOSED"] as const;
export type TicketStatus = (typeof STATUS_STEPS)[number];

interface Props {
  historyStatuses?: TicketStatus[]; // all statuses in order up to current
}

const STATUS_COLORS: Record<"completed" | "current" | "pending", string> = {
  completed: "bg-green-100 text-green-800",
  current: "bg-blue-100 text-blue-800",
  pending: "bg-gray-100 text-gray-500",
};

const LINE_COLORS: Record<"completed" | "pending", string> = {
  completed: "bg-green-400",
  pending: "bg-gray-300",
};

const ProgressTracker: React.FC<Props> = ({ historyStatuses = [] }) => {
  return (
    <div className="flex items-center gap-2 flex-wrap mt-2">
      {STATUS_STEPS.map((step, idx) => {
        let statusType: "completed" | "current" | "pending" = "pending";

        if (historyStatuses.includes(step)) {
          statusType =
            step === historyStatuses[historyStatuses.length - 1] ? "current" : "completed";
        }

        const isLast = idx === STATUS_STEPS.length - 1;

        return (
          <React.Fragment key={step}>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[statusType]}`}
            >
              {step.replace("_", " ")}
            </span>

            {!isLast && (
              <div
                className={`flex-1 h-1 ${
                  STATUS_STEPS[idx + 1] && historyStatuses.includes(STATUS_STEPS[idx + 1])
                    ? LINE_COLORS.completed
                    : LINE_COLORS.pending
                }`}
              ></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressTracker;
