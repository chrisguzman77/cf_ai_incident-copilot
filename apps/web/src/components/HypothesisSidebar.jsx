import React from "react";

export default function HypothesisSidebar({ state }) {
  if (!state?.hypothesis) {
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
          Current Hypothesis
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          Start a conversation to generate a hypothesis.
        </p>
      </div>
    );
  }

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
        Current Hypothesis
      </h3>
      <p style={{ fontSize: "14px", lineHeight: 1.5 }}>{state.hypothesis}</p>

      {state.findings?.length > 0 && (
        <div style={{ marginTop: "16px" }}>
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
            Findings
          </h3>
          {state.findings.map((f, i) => (
            <p
              key={i}
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginBottom: "8px",
              }}
            >
              {f}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}