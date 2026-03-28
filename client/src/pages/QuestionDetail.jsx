// src/pages/QuestionDetail.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Editor from "@monaco-editor/react";
import { calculateChangePercentage, countChanges } from "../utils/countCodeChanges";
import { executeCode } from "../utils/executeCode";
import { recordLocalLeaderboardActivity } from "../utils/leaderboardActivity";
import { API_BASE_URL } from "../config/api";
import { isAuthError, redirectToLogin, validateStoredSession } from "../utils/authSession";
import UserTopNav from "../components/UserTopNav";
import PageLoader from "../components/PageLoader";

function QuestionDetail() {
  const { level, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [question, setQuestion] = useState(null);
  const [originalCode, setOriginalCode] = useState("");
  const [changeCount, setChangeCount] = useState(0);
  const [changePercentage, setChangePercentage] = useState(0);
  const [output, setOutput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [discussionMessages, setDiscussionMessages] = useState([]);
  const [discussionInput, setDiscussionInput] = useState("");
  const [discussionLoading, setDiscussionLoading] = useState(false);
  const [discussionBusy, setDiscussionBusy] = useState(false);
  const [discussionError, setDiscussionError] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState(() => localStorage.getItem("role") || "user");
  const [pageError, setPageError] = useState("");
  const [revealedHints, setRevealedHints] = useState([]);
  const [areHintsVisible, setAreHintsVisible] = useState(false);
  const [solvedQuestions, setSolvedQuestions] = useState(() => {
    const stored = localStorage.getItem("debugQuestSolvedQuestions");
    return stored ? JSON.parse(stored) : [];
  });
  const [accuracyStats, setAccuracyStats] = useState(() => {
    const stored = localStorage.getItem("debugQuestAccuracyStats");
    return stored ? JSON.parse(stored) : { total: 0, correct: 0 };
  });

  useEffect(() => {
    localStorage.setItem("debugQuestSolvedQuestions", JSON.stringify(solvedQuestions));
  }, [solvedQuestions]);

  useEffect(() => {
    localStorage.setItem("debugQuestAccuracyStats", JSON.stringify(accuracyStats));
  }, [accuracyStats]);

  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      text: "Ask me anything about this debugging question.",
    },
  ]);
  const chatEndRef = useRef(null);
  const highlightedMessageId = useMemo(
    () => new URLSearchParams(location.search).get("highlightMessage"),
    [location.search]
  );
  const isAdminReviewMode = useMemo(
    () => new URLSearchParams(location.search).get("adminReview") === "1",
    [location.search]
  );

  const resolveCounterLanguage = (language, original, modified) => {
    const normalizedLang = String(language || "").toLowerCase();
    if (normalizedLang !== "text" && normalizedLang !== "plaintext") {
      return language;
    }

    const sample = `${String(original || "")}\n${String(modified || "")}`;
    const looksLikePython =
      /\bdef\s+\w+\s*\(/.test(sample) ||
      /\bprint\s*\(/.test(sample) ||
      /\bfor\s+\w+\s+in\b/.test(sample) ||
      /\bif\s+.+:/.test(sample) ||
      /\breturn\b/.test(sample);
    const looksLikeC =
      /#include\s*<[^>]+>/.test(sample) ||
      /\bint\s+main\s*\(/.test(sample) ||
      /\bprintf\s*\(/.test(sample);

    if (looksLikePython) return "python";
    if (looksLikeC) return "c";
    return "text";
  };

  useEffect(() => {
    setCurrentUserRole(localStorage.getItem("role") || "user");
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchQuestion = async () => {
      setPageError("");
      try {
        const isValid = await validateStoredSession(navigate);
        if (!isMounted || !isValid) return;

        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/questions/${level}/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!isMounted) return;
        setQuestion(res.data);
        setOriginalCode(res.data.code);
        setChangeCount(0);
        setChangePercentage(0);
        setRevealedHints([]);
        setAreHintsVisible(false);
        setCurrentUserRole(localStorage.getItem("role") || "user");
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          redirectToLogin(navigate);
          return;
        }

        if (!isMounted) return;
        setPageError("Unable to load this question right now.");
      }
    };
    fetchQuestion();
    return () => {
      isMounted = false;
    };
  }, [level, id, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (!question?._id) return;
    let isMounted = true;

    const loadDiscussion = async () => {
      setDiscussionLoading(true);
      setDiscussionError("");
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/discussions/questions/${question._id}/messages`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await response.json().catch(() => []);
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            redirectToLogin(navigate);
            return;
          }
          throw new Error(data?.message || "Unable to load discussion.");
        }
        if (!isMounted) return;
        setDiscussionMessages(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!isMounted) return;
        setDiscussionError(error.message || "Unable to load discussion.");
      } finally {
        if (isMounted) {
          setDiscussionLoading(false);
        }
      }
    };

    loadDiscussion();
    return () => {
      isMounted = false;
    };
  }, [question?._id, navigate]);

  useEffect(() => {
    if (!highlightedMessageId || discussionMessages.length === 0) return;

    const timer = window.setTimeout(() => {
      const element = document.getElementById(`discussion-message-${highlightedMessageId}`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [highlightedMessageId, discussionMessages]);

  const loadDiscussionMessages = async () => {
    if (!question?._id) return;
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/api/discussions/questions/${question._id}/messages`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await response.json().catch(() => []);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        redirectToLogin(navigate);
        return;
      }
      throw new Error(data?.message || "Unable to load discussion.");
    }
    setDiscussionMessages(Array.isArray(data) ? data : []);
  };

  const runCode = async () => {
    if (!question?.code?.trim()) {
      setOutput("No code to run.");
      return;
    }

    try {
      const result = await executeCode(question.language, question.code);
      setOutput(result);
    } catch (err) {
      if (String(err?.message || "").includes("Session expired")) {
        redirectToLogin(navigate);
        return;
      }
      setOutput(err?.message || "Error running code.");
    }
  };

  const submitCode = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/questions/submit`,
        {
          questionId: question._id,
          id: question.id,
          level,
          code: question.code,
          language: question.language,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (typeof res.data?.message === "string" && res.data.message.includes("Correct")) {
        recordLocalLeaderboardActivity();
        setAccuracyStats(prev => ({ total: prev.total + 1, correct: prev.correct + 1 }));
        setSolvedQuestions(prev => prev.includes(question._id) ? prev : [...prev, question._id]);

        // Update Performance Chart State
        const currentScoreStr = localStorage.getItem("debugQuestPerformanceScore");
        const currentScore = currentScoreStr ? parseInt(currentScoreStr, 10) : 100;
        const newScore = currentScore + 10;
        localStorage.setItem("debugQuestPerformanceScore", newScore.toString());
        
        const historyStr = localStorage.getItem("debugQuestPerformanceHistory");
        let hist = [{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: "2-digit", second: "2-digit" }), score: currentScore }];
        if (historyStr) { try { hist = JSON.parse(historyStr); } catch (e) {} }
        hist.push({ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: "2-digit", second: "2-digit" }), score: newScore });
        localStorage.setItem("debugQuestPerformanceHistory", JSON.stringify(hist.slice(-9)));

      } else {
        setAccuracyStats(prev => ({ total: prev.total + 1, correct: prev.correct }));
        // Wrong submission Performance Chart State
        const currentScoreStr = localStorage.getItem("debugQuestPerformanceScore");
        const currentScore = currentScoreStr ? parseInt(currentScoreStr, 10) : 100;
        const newScore = Math.max(0, currentScore - 2);
        localStorage.setItem("debugQuestPerformanceScore", newScore.toString());
        
        const historyStr = localStorage.getItem("debugQuestPerformanceHistory");
        let hist = [{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: "2-digit", second: "2-digit" }), score: currentScore }];
        if (historyStr) { try { hist = JSON.parse(historyStr); } catch (e) {} }
        hist.push({ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: "2-digit", second: "2-digit" }), score: newScore });
        localStorage.setItem("debugQuestPerformanceHistory", JSON.stringify(hist.slice(-9)));
      }
      alert(res.data.message);
    } catch (_err) {
      if (isAuthError(_err)) {
        redirectToLogin(navigate);
        return;
      }
      alert("Submission failed.");
    }
  };

  const askAI = async (event) => {
    event.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt || chatLoading) return;

    setChatMessages((prev) => [...prev, { role: "user", text: prompt }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/chatbot/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ q: prompt }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      const answer =
        typeof data?.answer === "string" && data.answer.trim()
          ? data.answer
          : "No answer returned by the AI service.";
      const score =
        data?.confidence !== undefined && data?.status
          ? `\n\nConfidence: ${data.confidence} (${data.status})`
          : "";

      setChatMessages((prev) => [...prev, { role: "assistant", text: `${answer}${score}` }]);
    } catch (_err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Unable to reach the AI service right now.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const sendDiscussionMessage = async (event) => {
    event.preventDefault();
    const text = discussionInput.trim();
    if (!text || !question?._id || discussionBusy) return;

    try {
      setDiscussionBusy(true);
      setDiscussionError("");
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/discussions/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          questionId: question._id,
          text,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          redirectToLogin(navigate);
          return;
        }
        throw new Error(data?.message || "Unable to send message.");
      }
      setDiscussionInput("");
      await loadDiscussionMessages();
    } catch (error) {
      setDiscussionError(error.message || "Unable to send message.");
    } finally {
      setDiscussionBusy(false);
    }
  };

  const reportDiscussionMessage = async (messageId) => {
    try {
      setDiscussionBusy(true);
      setDiscussionError("");
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/discussions/messages/${messageId}/report`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          redirectToLogin(navigate);
          return;
        }
        throw new Error(data?.message || "Unable to report message.");
      }
      await loadDiscussionMessages();
    } catch (error) {
      setDiscussionError(error.message || "Unable to report message.");
    } finally {
      setDiscussionBusy(false);
    }
  };

  const deleteDiscussionMessage = async (messageId) => {
    try {
      setDiscussionBusy(true);
      setDiscussionError("");
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/discussions/messages/${messageId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          redirectToLogin(navigate);
          return;
        }
        throw new Error(data?.message || "Unable to delete message.");
      }
      await loadDiscussionMessages();
    } catch (error) {
      setDiscussionError(error.message || "Unable to delete message.");
    } finally {
      setDiscussionBusy(false);
    }
  };

  if (pageError) {
    return (
      <p style={{ textAlign: "center", color: "#fca5a5", padding: "2rem" }}>
        {pageError}
      </p>
    );
  }

  if (!question) {
    return (
      <PageLoader
        title="Loading Challenge"
        subtitle="Setting up the editor, description, and discussion for this question..."
      />
    );
  }

  const liveThreshold =
    typeof question.maxChangePercentage === "number" ? question.maxChangePercentage : null;
  const isWithinThreshold = liveThreshold === null || changePercentage <= liveThreshold;
  const availableHints = Array.isArray(question.hints) ? question.hints.filter(Boolean) : [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#f1f5f9",
        padding: "clamp(16px, 4vw, 32px)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <UserTopNav
        breadcrumbItems={[
          { label: "Challenges", path: "/challenges" },
          { label: String(level || "").charAt(0).toUpperCase() + String(level || "").slice(1), path: `/${level}` },
          { label: question.title },
        ]}
      />

      <div
        style={{
          display: "flex",
          gap: "clamp(16px, 4vw, 36px)",
          alignItems: "flex-start",
          flexWrap: "wrap",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div style={{ flex: "1 1 900px", minWidth: "min(100%, 320px)", paddingLeft: "clamp(0px, 2vw, 18px)", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".5rem", flexWrap: "wrap", gap: "10px" }}>
            <h1
              style={{
                fontSize: "clamp(1.7rem, 5vw, 2.25rem)",
                fontWeight: "bold",
                color: "#f8fafc",
                margin: 0
              }}
            >
              {question.title}
            </h1>
          </div>

          <p style={{ fontSize: "1rem", color: "#94a3b8", marginBottom: "1rem" }}>
            Language: {question.language}
          </p>

          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <section
              style={{
                flex: "0 0 320px",
                width: "min(100%, 360px)",
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "0.75rem",
                padding: "1rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                alignSelf: "stretch",
              }}
            >
              <p style={{ margin: "0 0 0.75rem", color: "#f8fafc", fontWeight: 700, fontSize: "1.05rem" }}>
                Question Description
              </p>
              <div style={{ color: "#cbd5e1", whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
                {question.description?.trim() || "No description provided for this question."}
              </div>
            </section>

            <div style={{ flex: "1 1 540px", minWidth: "min(100%, 320px)" }}>
              <div
                style={{
                  border: "1px solid #334155",
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                  marginBottom: "1rem",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                <Editor
                  height="320px"
                  defaultLanguage={question.language.toLowerCase()}
                  value={question.code}
                  theme="vs-dark"
                  onChange={(newValue = "") => {
                    const effectiveLanguage = resolveCounterLanguage(
                      question.language,
                      originalCode,
                      newValue
                    );
                    const rawChangeNum = countChanges(originalCode, newValue, effectiveLanguage);
                    const changeNum = rawChangeNum < 0 ? 0 : rawChangeNum;
                    const rawChangePercentage = calculateChangePercentage(originalCode, newValue, effectiveLanguage);
                    const nextChangePercentage = rawChangePercentage < 0 ? 0 : rawChangePercentage;
                    setChangeCount(changeNum);
                    setChangePercentage(nextChangePercentage);
                    setQuestion((prev) => ({ ...prev, code: newValue }));
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <button
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "0.35rem",
                border: "none",
                cursor: "pointer",
                fontWeight: 500,
                backgroundColor: "#16a34a",
                color: "white",
                transition: "all 0.3s ease",
              }}
              onClick={runCode}
            >
              Run Code
            </button>
            <button
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "0.35rem",
                border: "none",
                cursor: "pointer",
                fontWeight: 500,
                backgroundColor: "#3b82f6",
                color: "white",
                transition: "all 0.3s ease",
              }}
              onClick={submitCode}
            >
              Submit
            </button>
            {availableHints.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setAreHintsVisible((prev) => {
                    const nextVisible = !prev;
                    if (nextVisible && !revealedHints.length) {
                      setRevealedHints([0]);
                    }
                    return nextVisible;
                  });
                }}
                style={{
                  padding: "0.6rem 1.2rem",
                  borderRadius: "0.35rem",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 500,
                  backgroundColor: "#f59e0b",
                  color: "#111827",
                  transition: "all 0.3s ease",
                }}
              >
                {areHintsVisible ? "Hide Hints" : "Hint"}
              </button>
            )}
              </div>

              {availableHints.length > 0 && areHintsVisible && (
                <div
                  style={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "0.75rem",
                    padding: "1rem",
                    marginBottom: "1rem",
                  }}
                >
              <p style={{ margin: "0 0 0.75rem", fontSize: "1rem", color: "#f8fafc", fontWeight: 700 }}>
                Available Hints
              </p>
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: revealedHints.length ? "0.9rem" : 0 }}>
                {availableHints.map((_, index) => {
                  const isRevealed = revealedHints.includes(index);
                  return (
                    <button
                      key={`hint-button-${index}`}
                      type="button"
                      onClick={() => {
                        if (!isRevealed) {
                          setRevealedHints((prev) => [...prev, index].sort((a, b) => a - b));
                        }
                      }}
                      style={{
                        border: "none",
                        borderRadius: "999px",
                        padding: "0.5rem 0.9rem",
                        background: isRevealed ? "#2563eb" : "#334155",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                    >
                      {`Hint ${index + 1}`}
                    </button>
                  );
                })}
              </div>
              {revealedHints.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {revealedHints.map((hintIndex) => (
                    <div
                      key={`revealed-hint-${hintIndex}`}
                      style={{
                        backgroundColor: "#111827",
                        border: "1px solid #334155",
                        borderRadius: "0.65rem",
                        padding: "0.85rem",
                        color: "#cbd5e1",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <strong style={{ color: "#f8fafc" }}>{`Hint ${hintIndex + 1}:`}</strong>{" "}
                      {availableHints[hintIndex]}
                    </div>
                  ))}
                </div>
              )}
                </div>
              )}

              <div
                style={{
                  backgroundColor: "#1e293b",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  fontFamily: "'Courier New', Courier, monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  marginBottom: "1rem",
                }}
              >
                <strong>Output:</strong> {output}
              </div>

              <p style={{ fontSize: "1rem", color: "#cbd5e1", marginBottom: "0.5rem" }}>
                <strong style={{ color: "#f1f5f9" }}>Expected Output:</strong> {question.expected}
              </p>
              <div
                style={{
                  backgroundColor: "#111827",
                  border: `1px solid ${isWithinThreshold ? "#14532d" : "#7f1d1d"}`,
                  borderRadius: "0.75rem",
                  padding: "1rem",
                }}
              >
                <p style={{ margin: "0 0 0.75rem", fontSize: "1rem", color: "#f8fafc", fontWeight: 700 }}>
                  Live Change Tracking
                </p>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <span style={{ color: "#cbd5e1" }}>Change units: <strong style={{ color: "#f8fafc" }}>{changeCount}</strong></span>
                  <span style={{ color: "#cbd5e1" }}>Change %: <strong style={{ color: "#f8fafc" }}>{changePercentage}%</strong></span>
                  <span style={{ color: "#cbd5e1" }}>Allowed %: <strong style={{ color: "#f8fafc" }}>{liveThreshold === null ? "No limit" : `${liveThreshold}%`}</strong></span>
                  <span style={{ color: isWithinThreshold ? "#86efac" : "#fca5a5", fontWeight: 700 }}>
                    {isWithinThreshold ? "Within limit" : "Above limit"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside
          style={{
            flex: "1 1 320px",
            minWidth: "min(100%, 300px)",
            backgroundColor: "#1e293b",
            border: "2px solid #334155",
            borderRadius: "0.75rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            height: "min(620px, 70vh)",
            minHeight: "420px",
            maxHeight: "620px",
            width: "100%",
          }}
        >
          <h2 style={{ margin: 0, marginBottom: "0.8rem", fontSize: "1.1rem", color: "#f8fafc" }}>
            Debug Assistant
          </h2>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              backgroundColor: "#0f172a",
              borderRadius: "2rem",
              border: "10px solid #334155",
              padding: "0.75rem",
            }}
          >
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={{
                  marginBottom: "0.6rem",
                  display: "flex",
                  justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "88%",
                    padding: "0.55rem 0.7rem",
                    borderRadius: "0.5rem",
                    whiteSpace: "pre-wrap",
                    backgroundColor: message.role === "user" ? "#1d4ed8" : "#334155",
                    color: "#f8fafc",
                    fontSize: "0.9rem",
                    lineHeight: 1.35,
                  }}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {chatLoading && <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Thinking...</div>}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={askAI} style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
            <input
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask about this bug..."
              style={{
                flex: "1 1 220px",
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "0.45rem",
                color: "#f1f5f9",
                padding: "0.55rem 0.7rem",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              style={{
                backgroundColor: chatLoading || !chatInput.trim() ? "#475569" : "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "0.45rem",
                padding: "0.55rem 0.9rem",
                minWidth: "110px",
                cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer",
              }}
            >
              Send
            </button>
          </form>
        </aside>
      </div>

      <div style={{ maxWidth: "1400px", margin: "1.25rem auto 0", paddingLeft: "clamp(0px, 2vw, 18px)" }}>
        <section
          style={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "0.85rem",
            padding: "1rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.9rem" }}>
            <div>
              <h2 style={{ margin: 0, color: "#f8fafc", fontSize: "1.15rem" }}>Problem Discussion</h2>
              <p style={{ margin: "0.3rem 0 0", color: "#94a3b8" }}>
                Each question has its own separate discussion.
              </p>
            </div>
            {isAdminReviewMode && currentUserRole === "admin" && (
              <span
                style={{
                  alignSelf: "flex-start",
                  background: "#7c3aed",
                  color: "white",
                  padding: "0.4rem 0.7rem",
                  borderRadius: "999px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                }}
              >
                Admin Review Mode
              </span>
            )}
          </div>

          {discussionError ? (
            <p style={{ marginTop: 0, color: "#fca5a5" }}>{discussionError}</p>
          ) : null}

          <div
            style={{
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "0.75rem",
              padding: "0.9rem",
              minHeight: "180px",
              maxHeight: "360px",
              overflowY: "auto",
              marginBottom: "0.9rem",
            }}
          >
            {discussionLoading ? (
              <p style={{ margin: 0, color: "#94a3b8" }}>Loading discussion...</p>
            ) : discussionMessages.length === 0 ? (
              <p style={{ margin: 0, color: "#94a3b8" }}>No messages yet. Start the discussion.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {discussionMessages.map((message) => {
                  const isHighlighted = highlightedMessageId === message._id;
                  return (
                    <div
                      key={message._id}
                      id={`discussion-message-${message._id}`}
                      style={{
                        background: isHighlighted ? "#312e81" : "#111827",
                        border: `1px solid ${isHighlighted ? "#818cf8" : "#334155"}`,
                        borderRadius: "0.7rem",
                        padding: "0.8rem",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <p style={{ margin: "0 0 0.35rem", color: "#f8fafc", fontWeight: 700 }}>
                        {message.authorUsername}
                      </p>
                      <p style={{ margin: "0 0 0.55rem", color: "#cbd5e1" }}>{message.text}</p>
                      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ color: "#94a3b8", fontSize: "0.82rem" }}>
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                        {message.canReport && (
                          <button
                            type="button"
                            disabled={discussionBusy}
                            onClick={() => reportDiscussionMessage(message._id)}
                            style={{
                              border: "none",
                              borderRadius: "999px",
                              padding: "0.38rem 0.72rem",
                              background: message.isReportedByCurrentUser ? "#64748b" : "#f59e0b",
                              color: message.isReportedByCurrentUser ? "#f8fafc" : "#111827",
                              cursor: discussionBusy ? "not-allowed" : "pointer",
                              fontWeight: 700,
                            }}
                          >
                            {message.isReportedByCurrentUser ? "Undo Report" : "Report"}
                          </button>
                        )}
                        {currentUserRole === "admin" && message.canDelete && (
                          <button
                            type="button"
                            disabled={discussionBusy}
                            onClick={() => deleteDiscussionMessage(message._id)}
                            style={{
                              border: "none",
                              borderRadius: "999px",
                              padding: "0.38rem 0.72rem",
                              background: "#dc2626",
                              color: "white",
                              cursor: discussionBusy ? "not-allowed" : "pointer",
                              fontWeight: 700,
                            }}
                          >
                            Delete
                          </button>
                        )}
                        {message.reportCount > 0 && (
                          <span style={{ color: "#fbbf24", fontSize: "0.82rem", fontWeight: 700 }}>
                            {message.reportCount} report{message.reportCount === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={sendDiscussionMessage} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-start" }}>
            <textarea
              value={discussionInput}
              onChange={(event) => setDiscussionInput(event.target.value)}
              placeholder="Discuss this problem with other users..."
              rows={3}
              style={{
                flex: "1 1 520px",
                minHeight: "84px",
                background: "#0f172a",
                color: "#f8fafc",
                border: "1px solid #334155",
                borderRadius: "0.75rem",
                padding: "0.8rem",
                resize: "vertical",
              }}
            />
            <button
              type="submit"
              disabled={discussionBusy || !discussionInput.trim()}
              style={{
                border: "none",
                borderRadius: "0.75rem",
                padding: "0.8rem 1rem",
                background: discussionBusy || !discussionInput.trim() ? "#475569" : "#2563eb",
                color: "white",
                cursor: discussionBusy || !discussionInput.trim() ? "not-allowed" : "pointer",
                fontWeight: 700,
                minWidth: "130px",
              }}
            >
              Send Message
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default QuestionDetail;
