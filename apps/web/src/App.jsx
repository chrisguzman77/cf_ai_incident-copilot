import React, { useState, useCallback } from "react";
import ChatPanel from "./components/ChatPanel";
import HypothesisSidebar from "./components/HypothesisSidebar";
import ActionChecklist from "./components/ActionChecklist";
import PostmortemButton from "./components/PostmortemButton";
import IncidentHeader from "./components/IncidentHeader";

// CHANGE THIS to your deployed API worker URL
const API_BASE = "https://incident-api.chrisguzman152003.workers.dev";

// Generate a session ID (in production, use something more robust)
function getSessionId() {
  let id = sessionStorage.getItem("incident-session-id");
  if (!id) {
    id = `inc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem("incident-session-id", id);
  }
  return id;
}

export default function App() {
  const sessionId = getSessionId();
  const [messages, setMessages] = useState([]);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [postmortem, setPostmortem] = useState(null);

  const sendMessage = useCallback(
    async (text) => {
      // Optimistically add user message
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setLoading(true);

      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, message: text }),
        });
        const data = await res.json();
        console.log("API response:", data);
        console.log("Structured data:", data.structured);
        
        // Add assistant response
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
        

        // Refresh state for sidebar
        const stateRes = await fetch(
          `${API_BASE}/api/state?sessionId=${sessionId}`
        );
        const newState = await stateRes.json();
        setState(newState);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Error contacting the API. Check the console.",
          },
        ]);
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const toggleAction = useCallback(
    async (index) => {
      await fetch(`${API_BASE}/api/action/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, index }),
      });
      // Refresh state
      const stateRes = await fetch(
        `${API_BASE}/api/state?sessionId=${sessionId}`
      );
      setState(await stateRes.json());
    },
    [sessionId]
  );

  const generatePostmortem = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/postmortem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const { workflowId } = await res.json();

    // Poll for completion
    const poll = setInterval(async () => {
      const statusRes = await fetch(
        `${API_BASE}/api/postmortem/status?id=${workflowId}`
      );
      const status = await statusRes.json();
      if (status.status === "complete") {
        clearInterval(poll);
        setPostmortem(status.output);
      }
    }, 2000);
  }, [sessionId]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "300px 1fr 300px",
        gridTemplateRows: "auto 1fr",
        height: "100vh",
        gap: 0,
      }}
    >
      {/* Header spans full width */}
      <div style={{ gridColumn: "1 / -1" }}>
        <IncidentHeader state={state} />
      </div>

      {/* Left sidebar */}
      <div
        style={{
          borderRight: "1px solid var(--border)",
          padding: "16px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <HypothesisSidebar state={state} />
        <ActionChecklist
          actions={state?.actions || []}
          onToggle={toggleAction}
        />
      </div>

      {/* Main chat panel */}
      <ChatPanel
        messages={messages}
        onSend={sendMessage}
        loading={loading}
      />

      {/* Right sidebar — postmortem */}
      <div
        style={{
          borderLeft: "1px solid var(--border)",
          padding: "16px",
          overflowY: "auto",
        }}
      >
        <PostmortemButton
          onGenerate={generatePostmortem}
          postmortem={postmortem}
        />
      </div>
    </div>
  );
}