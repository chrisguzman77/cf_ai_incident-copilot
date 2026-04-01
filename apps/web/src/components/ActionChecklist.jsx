import React from "react";

export default function ActionChecklist({ actions, onToggle }) {
  return (
    <div>
      <h3
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "8px",
        }}
      >
        Action Items
      </h3>
      {actions.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          No actions yet.
        </p>
      ) : (
        actions.map((action, i) => (
          <label
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              marginBottom: "12px",
              cursor: "pointer",
              fontSize: "13px",
              lineHeight: 1.4,
              color: action.done ? "var(--text-muted)" : "var(--text)",
              textDecoration: action.done ? "line-through" : "none",
            }}
          >
            <input
              type="checkbox"
              checked={action.done}
              onChange={() => onToggle(i)}
              style={{ marginTop: "2px" }}
            />
            {action.text}
          </label>
        ))
      )}
    </div>
  );
}