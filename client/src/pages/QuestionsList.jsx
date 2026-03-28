// src/pages/QuestionsList.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { redirectToLogin, validateStoredSession } from "../utils/authSession";
import UserTopNav from "../components/UserTopNav";
import PageLoader from "../components/PageLoader";

function QuestionsList() {
  const { level } = useParams(); // easy, medium, hard
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [solvedQuestions, setSolvedQuestions] = useState(() => {
    const stored = localStorage.getItem("debugQuestSolvedQuestions");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("debugQuestSolvedQuestions", JSON.stringify(solvedQuestions));
  }, [solvedQuestions]);

  useEffect(() => {
    let isMounted = true;

    const fetchQuestions = async () => {
      setErrorMessage("");
      try {
        const isValid = await validateStoredSession(navigate);
        if (!isMounted || !isValid) return;

        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/questions/${level}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!isMounted) return;
        setQuestions(res.data);
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          redirectToLogin(navigate);
          return;
        }

        if (!isMounted) return;
        setErrorMessage("Unable to load questions right now.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchQuestions();
    return () => {
      isMounted = false;
    };
  }, [level, navigate]);

  const availableLanguages = Array.from(
    new Set(
      questions
        .map((question) => String(question?.language || "").trim())
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right));

  const filteredQuestions = questions.filter((question) => {
    const normalizedQuestionLanguage = String(question?.language || "").toLowerCase();
    const matchesLanguage =
      selectedLanguage === "all" ||
      normalizedQuestionLanguage === selectedLanguage.toLowerCase();

    const isSolved = solvedQuestions.includes(question._id);
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "solved" && isSolved) ||
      (selectedStatus === "unsolved" && !isSolved);

    return matchesLanguage && matchesStatus;
  });

  const solvedCount = questions.filter((question) => solvedQuestions.includes(question._id)).length;

  if (loading) {
    return (
      <PageLoader
        title={`Preparing ${String(level || "").charAt(0).toUpperCase() + String(level || "").slice(1)} Challenges`}
        subtitle="Loading your question list and filters..."
      />
    );
  }

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
      <UserTopNav
        breadcrumbItems={[
          { label: "Challenges", path: "/challenges" },
          { label: String(level || "").charAt(0).toUpperCase() + String(level || "").slice(1) },
        ]}
      />
      <div
        style={{
          width: "100%",
          maxWidth: "1180px",
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
      </div>

      {errorMessage ? (
        <p style={{ color: "#fca5a5", fontSize: "1rem" }}>{errorMessage}</p>
      ) : questions.length === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: "1rem" }}>No questions found.</p>
      ) : (
        <div
          style={{
            display: "flex",
            width: "100%",
            maxWidth: "1180px",
            gap: "1.5rem",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 720px", minWidth: "min(100%, 320px)" }}>
            <ul
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                width: "100%",
                listStyle: "none",
                paddingLeft: 0,
                margin: 0,
              }}
            >
              {filteredQuestions.length === 0 ? (
                <li
                  style={{
                    backgroundColor: "#1e293b",
                    padding: "1.25rem 1.5rem",
                    borderRadius: "0.75rem",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    color: "#94a3b8",
                  }}
                >
                  No questions match the selected filters.
                </li>
              ) : (
                filteredQuestions.map((q, index) => (
                  <li
                    key={q._id}
                    style={{
                      backgroundColor: "#1e293b",
                      padding: "1rem 1.5rem",
                      borderRadius: "0.75rem",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#334155")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1e293b")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <input 
                        type="checkbox" 
                        checked={solvedQuestions.includes(q._id)} 
                        onChange={() => {
                            setSolvedQuestions(prev => prev.includes(q._id) ? prev.filter(id => id !== q._id) : [...prev, q._id]);
                        }} 
                        style={{ cursor: "pointer", width: "18px", height: "18px", flexShrink: 0 }}
                      />
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
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginTop: "0.25rem", paddingLeft: "30px" }}>
                      Language: {q.language}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>

          <aside
            style={{
              flex: "0 0 280px",
              width: "min(100%, 300px)",
              background: "linear-gradient(145deg, #1e293b, #111827)",
              border: "1px solid #334155",
              borderRadius: "1rem",
              padding: "1.1rem",
              boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
              position: "sticky",
              top: "155px",
            }}
          >
            <p style={{ margin: "0 0 0.9rem", color: "#f8fafc", fontWeight: 800, fontSize: "1rem" }}>
              Filters
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}>
              <div>
                <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.84rem", marginBottom: "0.4rem" }}>
                  Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(event) => setSelectedLanguage(event.target.value)}
                  style={{
                    width: "100%",
                    background: "#0f172a",
                    color: "#f8fafc",
                    border: "1px solid #334155",
                    borderRadius: "0.7rem",
                    padding: "0.75rem 0.85rem",
                  }}
                >
                  <option value="all">All Languages</option>
                  {availableLanguages.map((language) => (
                    <option key={language} value={language.toLowerCase()}>
                      {language}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.84rem", marginBottom: "0.4rem" }}>
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  style={{
                    width: "100%",
                    background: "#0f172a",
                    color: "#f8fafc",
                    border: "1px solid #334155",
                    borderRadius: "0.7rem",
                    padding: "0.75rem 0.85rem",
                  }}
                >
                  <option value="all">All Questions</option>
                  <option value="solved">Solved</option>
                  <option value="unsolved">Unsolved</option>
                </select>
              </div>

              <div
                style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(51, 65, 85, 0.9)",
                  borderRadius: "0.85rem",
                  padding: "0.85rem 0.9rem",
                  color: "#cbd5e1",
                }}
              >
                <p style={{ margin: "0 0 0.5rem", color: "#f8fafc", fontWeight: 700 }}>
                  Progress
                </p>
                <p style={{ margin: "0 0 0.35rem", fontSize: "0.9rem" }}>
                  Showing: <strong style={{ color: "#f8fafc" }}>{filteredQuestions.length}</strong>
                </p>
                <p style={{ margin: "0 0 0.35rem", fontSize: "0.9rem" }}>
                  Solved: <strong style={{ color: "#86efac" }}>{solvedCount}</strong>
                </p>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                  Total: <strong style={{ color: "#f8fafc" }}>{questions.length}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedLanguage("all");
                  setSelectedStatus("all");
                }}
                style={{
                  border: "1px solid rgba(96, 165, 250, 0.32)",
                  borderRadius: "0.7rem",
                  padding: "0.72rem 0.9rem",
                  background: "rgba(37, 99, 235, 0.12)",
                  color: "#bfdbfe",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Reset Filters
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default QuestionsList;
