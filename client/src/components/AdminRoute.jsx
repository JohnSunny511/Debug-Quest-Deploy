import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

function AdminRoute({ children }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const previousRobots = document.querySelector('meta[name="robots"]');
    const meta = previousRobots || document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex, nofollow");
    if (!previousRobots) {
      document.head.appendChild(meta);
    }

    const verifyAdmin = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/internal/access`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          setStatus("ready");
          return;
        }

        const data = await response.json().catch(() => ({}));
        navigate(data?.redirectTo || (response.status === 401 ? "/login" : "/challenges"), {
          replace: true,
        });
      } catch (_error) {
        navigate("/challenges", { replace: true });
      }
    };

    verifyAdmin();
  }, [navigate]);

  if (status !== "ready") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#f1f5f9",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
        Checking access...
      </div>
    );
  }

  return children;
}

export default AdminRoute;
