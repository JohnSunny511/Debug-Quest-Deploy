import React from "react";
import { useNavigate } from "react-router-dom";
import { clearStoredSession } from "../utils/authSession";

function AdminLogoutButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => {
        clearStoredSession();
        navigate("/login", { replace: true });
      }}
      style={{
        border: "none",
        borderRadius: "8px",
        padding: "0.65rem 1rem",
        background: "#dc2626",
        color: "white",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      Logout
    </button>
  );
}

export default AdminLogoutButton;
