import React from "react";

const severityColors = {
  critical: "var(--critical)",
  high: "var(--high)",
  medium: "var(--medium)",
  low: "var(--low)",
  unknown: "var(--text-muted)",
};

export default function IncidentHeader({ state }) {
  const title = state?.title || "New Incident";
  const severity = state?.severity || "unknown";
  const status = state?.status || "investigating";

  return (
    <div
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <h1 style={{ fontSize: "18px", fontWeight: 600 }}>{title}</h1>
      <span
        style={{
          background: severityColors[severity],
          color: "#fff",
          padding: "2px 10px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        {severity}
      </span>
      <span
        style={{
          color: "var(--text-muted)",
          fontSize: "13px",
          textTransform: "capitalize",
        }}
      >
        {status}
      </span>
    </div>
  );
}