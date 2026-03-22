import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setErrorMessage("");
    axios.get(`${API_BASE_URL}/api/leaderboard`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => setUsers(res.data))
      .catch((error) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          navigate("/login", { replace: true });
          return;
        }

        setErrorMessage("Unable to load leaderboard right now.");
      });
  }, [navigate]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "#f1f5f9",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "clamp(16px, 4vw, 32px)",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>

      <h1 style={{
        fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
        fontWeight: "bold",
        marginBottom: "2rem",
        color: "#f8fafc"
      }}>
        🏆 Leaderboard
      </h1>

      <div style={{
        width: "100%",
        maxWidth: "700px",
        backgroundColor: "#1e293b",
        borderRadius: "0.6rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
        padding: "1rem"
      }}>

        {/* Header row */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: "1px solid #334155",
          color: "#94a3b8",
          fontSize: "0.9rem",
          fontWeight: "600"
        }}>
          <span>User</span>
          <span>Score</span>
        </div>

        {/* Users */}
        {errorMessage ? (
          <p style={{ textAlign: "center", padding: "20px", color: "#fca5a5" }}>
            {errorMessage}
          </p>
        ) : users.length === 0 ? (
          <p style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
            No users yet.
          </p>
        ) : (
          users.map((user, index) => {
            // special colors for top 3
            let rankColor = "#94a3b8";
            if (index === 0) rankColor = "#facc15"; // gold
            if (index === 1) rankColor = "#cbd5f5"; // silver
            if (index === 2) rankColor = "#fdba74"; // bronze

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 16px",
                  borderBottom: "1px solid #334155",
                  transition: "all 0.2s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#334155"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    fontWeight: "bold",
                    color: rankColor,
                    fontSize: "1.1rem",
                    width: "35px"
                  }}>
                    #{index + 1}
                  </span>

                  <span style={{
                    fontSize: "1.05rem",
                    fontWeight: "600"
                  }}>
                    {user.username}
                  </span>
                </div>

                <span style={{
                  color: "#3b82f6",
                  fontWeight: "700",
                  fontSize: "1.05rem"
                }}>
                  {user.points} pts
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
