import React, { useState, useRef, useEffect } from "react";

export default function ChatPanel({ messages, onSend, loading }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              color: "var(--text-muted)",
              textAlign: "center",
              marginTop: "40vh",
              transform: "translateY(-50%)",
            }}
          >
            <p style={{ fontSize: "16px", marginBottom: "8px" }}>
              Paste an error log, describe an outage, or share suspicious
              traffic patterns.
            </p>
            <p style={{ fontSize: "13px" }}>
              The copilot will diagnose, prioritize, and track your incident.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "75%",
              padding: "12px 16px",
              borderRadius: "12px",
              background:
                msg.role === "user" ? "var(--accent)" : "var(--surface)",
              color: msg.role === "user" ? "#fff" : "var(--text)",
              fontSize: "14px",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              fontFamily:
                msg.role === "assistant"
                  ? "'JetBrains Mono', monospace"
                  : "inherit",
            }}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              fontStyle: "italic",
            }}
          >
            Analyzing...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        style={{
          borderTop: "1px solid var(--border)",
          padding: "16px 20px",
          display: "flex",
          gap: "12px",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe the issue or paste logs..."
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text)",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: "10px 20px",
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.5 : 1,
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}