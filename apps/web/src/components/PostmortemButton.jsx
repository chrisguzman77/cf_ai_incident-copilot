import React, { useState } from "react";

export default function PostmortemButton({ onGenerate, postmortem }) {
  const [generating, setGenerating] = useState(false);

  const handleClick = async () => {
    setGenerating(true);
    await onGenerate();
    // The parent will poll for completion and set postmortem
    // We'll watch for it via the prop
  };

  // Stop showing "generating" once we have the postmortem
  React.useEffect(() => {
    if (postmortem) setGenerating(false);
  }, [postmortem]);

  return (
    <div>
      <h3
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "12px",
        }}
      >
        Postmortem
      </h3>

      {!postmortem && (
        <button
          onClick={handleClick}
          disabled={generating}
          style={{
            width: "100%",
            padding: "10px",
            background: generating ? "var(--border)" : "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: generating ? "not-allowed" : "pointer",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {generating ? "Generating..." : "Generate Postmortem"}
        </button>
      )}

      {postmortem && (
        <div
          style={{
            fontSize: "13px",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            fontFamily: "'JetBrains Mono', monospace",
            color: "var(--text)",
            marginTop: "12px",
          }}
        >
          {postmortem}
        </div>
      )}
    </div>
  );
}