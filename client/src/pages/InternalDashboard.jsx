import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function InternalDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Internal Dashboard";
  }, []);

  const cardStyle = {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "1.25rem",
    width: "min(100%, 280px)",
    flex: "1 1 260px",
    color: "#f8fafc",
    textAlign: "left",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#f8fafc",
        padding: "clamp(16px, 4vw, 32px)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div style={{ maxWidth: "920px", margin: "0 auto" }}>
        <h1 style={{ marginTop: 0, fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}>Internal Dashboard</h1>
        <p style={{ color: "#94a3b8", maxWidth: "640px" }}>
          Restricted admin workspace for internal content and chatbot controls.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Question Manager</h2>
            <p style={{ color: "#cbd5e1" }}>Create and remove internal challenge content.</p>
            <button
              type="button"
              onClick={() => navigate("/dashboard/internal/questions")}
              style={{
                border: "none",
                borderRadius: "8px",
                padding: "0.65rem 1rem",
                background: "#2563eb",
                color: "white",
                cursor: "pointer",
              }}
            >
              Open
            </button>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Chatbot Settings</h2>
            <p style={{ color: "#cbd5e1" }}>Manage internal chatbot documents and memory.</p>
            <button
              type="button"
              onClick={() => navigate("/dashboard/internal/chatbot")}
              style={{
                border: "none",
                borderRadius: "8px",
                padding: "0.65rem 1rem",
                background: "#2563eb",
                color: "white",
                cursor: "pointer",
              }}
            >
              Open
            </button>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>User View Simulation</h2>
            <p style={{ color: "#cbd5e1" }}>
              Jump into the regular user interface to verify content, challenge flow, and applied changes.
            </p>
            <button
              type="button"
              onClick={() => navigate("/challenges")}
              style={{
                border: "none",
                borderRadius: "8px",
                padding: "0.65rem 1rem",
                background: "#0f766e",
                color: "white",
                cursor: "pointer",
              }}
            >
              Open User Experience
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InternalDashboard;
