import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearStoredSession } from "../utils/authSession";

function UserTopNav({ breadcrumbItems = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const username = localStorage.getItem("username") || "User";
  const role = localStorage.getItem("role") || "user";

  const navItems = useMemo(
    () =>
      [
        { label: "Challenges", path: "/challenges", active: location.pathname !== "/leaderboard" && !location.pathname.startsWith("/dashboard/internal") },
        { label: "LeaderBoard", path: "/leaderboard", active: location.pathname === "/leaderboard" },
        role === "admin"
          ? { label: "Admin Dashboard", path: "/dashboard/internal", active: location.pathname.startsWith("/dashboard/internal") }
          : null,
      ].filter(Boolean),
    [location.pathname, role]
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = () => {
    clearStoredSession();
    window.location.href = "/login";
  };

  const visibleBreadcrumbs = Array.isArray(breadcrumbItems)
    ? breadcrumbItems.filter((item) => item && item.label)
    : [];
  const hasBreadcrumbs = visibleBreadcrumbs.length > 0;

  return (
    <div
      style={{
        width: "100%",
        margin: "0 auto 1.5rem",
        position: "sticky",
        top: "12px",
        zIndex: 120,
        overflow: "visible",
      }}
    >
      <header
        style={{
          padding: "1rem 1.15rem",
          background:
            "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(17, 24, 39, 0.9))",
          border: "1px solid rgba(71, 85, 105, 0.72)",
          borderRadius: hasBreadcrumbs ? "22px 22px 0 0" : "22px",
          backdropFilter: "blur(18px)",
          boxShadow:
            "0 20px 40px rgba(2, 6, 23, 0.34), inset 0 1px 0 rgba(148, 163, 184, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "15px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #2563eb, #0891b2 55%, #14b8a6)",
                color: "white",
                fontWeight: 800,
                fontSize: "0.95rem",
                letterSpacing: "0.08em",
                boxShadow: "0 14px 26px rgba(14, 165, 233, 0.22)",
                flexShrink: 0,
              }}
            >
              DQ
            </span>
            <span
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                letterSpacing: "0.03em",
                fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
                background: "linear-gradient(90deg, #f8fafc, #bfdbfe 45%, #67e8f9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Debug Quest
            </span>
          </button>

          <span
            aria-hidden="true"
            style={{
              width: "1px",
              height: "34px",
              background: "linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.42), transparent)",
            }}
          />

          <nav style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                style={{
                  border: item.active
                    ? "1px solid rgba(96, 165, 250, 0.18)"
                    : "1px solid rgba(51, 65, 85, 0.85)",
                  borderRadius: "999px",
                  padding: "0.65rem 1rem",
                  background: item.active
                    ? "linear-gradient(90deg, rgba(37, 99, 235, 0.95), rgba(14, 116, 144, 0.95))"
                    : "rgba(15, 23, 42, 0.38)",
                  color: item.active ? "white" : "#cbd5e1",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: item.active ? "0 10px 24px rgba(37, 99, 235, 0.18)" : "none",
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div ref={menuRef} style={{ position: "relative", zIndex: 160 }}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            style={{
              border: "1px solid rgba(71, 85, 105, 0.95)",
              borderRadius: "999px",
              background: "rgba(15, 23, 42, 0.92)",
              color: "#f8fafc",
              padding: "0.35rem 0.6rem 0.35rem 0.35rem",
              display: "flex",
              alignItems: "center",
              gap: "0.55rem",
              cursor: "pointer",
              boxShadow: "0 12px 28px rgba(2, 6, 23, 0.28)",
            }}
          >
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #38bdf8, #1d4ed8)",
                color: "#f8fafc",
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              {username.slice(0, 1) || "U"}
            </span>
            <span style={{ color: "#cbd5e1", fontSize: "0.95rem", fontWeight: 600 }}>
              Profile
            </span>
          </button>

          {isMenuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 10px)",
                minWidth: "220px",
                background: "linear-gradient(180deg, #111827, #0f172a)",
                border: "1px solid #334155",
                borderRadius: "18px",
                boxShadow: "0 18px 36px rgba(2, 6, 23, 0.45)",
                padding: "0.95rem",
                zIndex: 220,
              }}
            >
              <p style={{ margin: "0 0 0.25rem", color: "#94a3b8", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Signed In As
              </p>
              <p style={{ margin: "0 0 0.85rem", color: "#f8fafc", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {username}
              </p>
              {role === "admin" && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate("/dashboard/internal");
                  }}
                  style={{
                    width: "100%",
                    border: "1px solid rgba(14, 165, 233, 0.34)",
                    borderRadius: "10px",
                    padding: "0.7rem 0.9rem",
                    background: "linear-gradient(90deg, rgba(37, 99, 235, 0.95), rgba(14, 116, 144, 0.95))",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                    marginBottom: "0.65rem",
                  }}
                >
                  Go To Admin Dashboard
                </button>
              )}
              <button
                type="button"
                onClick={logout}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0.7rem 0.9rem",
                  background: "#dc2626",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {hasBreadcrumbs && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginTop: "0.65rem",
            padding: "0.65rem 1.15rem 0.2rem",
            background:
              "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(17, 24, 39, 0.9))",
            borderLeft: "1px solid rgba(71, 85, 105, 0.72)",
            borderRight: "1px solid rgba(71, 85, 105, 0.72)",
            borderBottom: "1px solid rgba(71, 85, 105, 0.72)",
            borderRadius: "0 0 22px 22px",
            boxShadow:
              "0 20px 40px rgba(2, 6, 23, 0.34), inset 0 1px 0 rgba(148, 163, 184, 0.04)",
          }}
        >
          {visibleBreadcrumbs.map((item, index) => {
            const isLast = index === visibleBreadcrumbs.length - 1;
            return (
              <React.Fragment key={`${item.label}-${index}`}>
                {item.path && !isLast ? (
                  <button
                    type="button"
                    onClick={() => navigate(item.path)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#93c5fd",
                      padding: 0,
                      cursor: "pointer",
                      fontSize: "0.92rem",
                      fontWeight: 600,
                    }}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span
                    style={{
                      color: isLast ? "#f8fafc" : "#93c5fd",
                      fontSize: "0.92rem",
                      fontWeight: isLast ? 700 : 600,
                    }}
                  >
                    {item.label}
                  </span>
                )}
                {!isLast && (
                  <span style={{ color: "#64748b", fontSize: "0.9rem" }} aria-hidden="true">
                    &gt;
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserTopNav;
