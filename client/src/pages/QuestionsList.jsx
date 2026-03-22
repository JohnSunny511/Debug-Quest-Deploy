// src/pages/QuestionsList.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

function QuestionsList() {
  const { level } = useParams(); // easy, medium, hard
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchQuestions = async () => {
      setErrorMessage("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/questions/${level}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setQuestions(res.data);
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          navigate("/login", { replace: true });
          return;
        }

        setErrorMessage("Unable to load questions right now.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [level, navigate]);

  if (loading) return <p style={{ textAlign: "center", color: "#94a3b8" }}>Loading {level} questions...</p>;

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
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{
          fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
          fontWeight: "bold",
          margin: 0,
          textTransform: "capitalize",
          color: "#f8fafc"
        }}>
          {level} Questions
        </h1>

        <button
          type="button"
          onClick={() => navigate("/leaderboard")}
          style={{
            border: "none",
            borderRadius: "999px",
            padding: "0.7rem 1.15rem",
            background: "#2563eb",
            color: "white",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Leaderboard
        </button>
      </div>

      {errorMessage ? (
        <p style={{ color: "#fca5a5", fontSize: "1rem" }}>{errorMessage}</p>
      ) : questions.length === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: "1rem" }}>No questions found.</p>
      ) : (
        <ul
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            width: "100%",
            maxWidth: "700px",
            listStyle: "none",
            paddingLeft: 0,
            margin: 0,
          }}
        >
          {questions.map((q, index) => (
            <li
              key={q._id}
              style={{
                backgroundColor: "#1e293b",
                padding: "1rem 1.5rem",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#334155")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1e293b")}
            >
              <Link
                to={`/${level}/${q.id}`}
                style={{
                  color: "#3b82f6",
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                {index + 1}. {q.title}
              </Link>
              <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Language: {q.language}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default QuestionsList;
