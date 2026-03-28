import React from "react";

function PageLoader({ title = "Preparing Debug Quest", subtitle = "Loading your next view..." }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "linear-gradient(135deg, #061429 0%, #0a2d50 45%, #0c1f39 100%)",
        color: "#f8fafc",
        fontFamily: "'Avenir Next', 'Montserrat', 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "min(100%, 420px)",
          borderRadius: "24px",
          padding: "28px 24px",
          background: "rgba(7, 22, 41, 0.72)",
          border: "1px solid rgba(148, 194, 228, 0.18)",
          boxShadow: "0 24px 60px rgba(2, 8, 18, 0.38)",
          backdropFilter: "blur(12px)",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
          <span
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #00b4f6, #0de0a8)",
              color: "#05203b",
              fontWeight: 800,
              boxShadow: "0 12px 24px rgba(0, 180, 246, 0.28)",
            }}
          >
            &lt;/&gt;
          </span>
          <div>
            <p style={{ margin: 0, color: "#8fe8ff", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Debug Quest
            </p>
            <h2 style={{ margin: "4px 0 0", fontSize: "1.35rem", color: "#f8fafc" }}>{title}</h2>
          </div>
        </div>

        <p style={{ margin: "0 0 18px", color: "#c7dff2", lineHeight: 1.7 }}>
          {subtitle}
        </p>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              style={{
                width: "11px",
                height: "11px",
                borderRadius: "999px",
                background: dot === 1 ? "#7be3ff" : "rgba(123, 227, 255, 0.45)",
                boxShadow: dot === 1 ? "0 0 18px rgba(123, 227, 255, 0.4)" : "none",
                animation: `loaderPulse 1.2s ease-in-out ${dot * 0.18}s infinite`,
              }}
            />
          ))}
        </div>

        <style>
          {`
            @keyframes loaderPulse {
              0%, 100% { transform: translateY(0); opacity: 0.45; }
              50% { transform: translateY(-4px); opacity: 1; }
            }
          `}
        </style>
      </div>
    </div>
  );
}

export default PageLoader;
