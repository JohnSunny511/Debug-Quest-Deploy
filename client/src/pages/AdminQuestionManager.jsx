import React, { useCallback, useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { API_BASE_URL } from "../config/api";

const API_BASE = `${API_BASE_URL}/api/dashboard/internal/questions`;

function AdminQuestionManager() {
  const [questionName, setQuestionName] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [language, setLanguage] = useState("python");
  const [difficulty, setDifficulty] = useState("easy");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showAddForm, setShowAddForm] = useState(true);
  const [expandedItems, setExpandedItems] = useState({});

  const readResponseData = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    const text = await response.text();
    return { rawText: text };
  };

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setStatusMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_BASE, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await readResponseData(response);
      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to load questions (status ${response.status}). Restart backend server if route was newly added.`
        );
      }
      setQuestions(Array.isArray(data) ? data : []);
    } catch (error) {
      setStatusMessage(error.message || "Unable to fetch questions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const resetForm = () => {
    setQuestionName("");
    setQuestionText("");
    setAnswerText("");
    setExpectedOutcome("");
    setLanguage("python");
    setDifficulty("easy");
  };

  const handleAddQuestion = async (event) => {
    event.preventDefault();
    if (busy) return;

    const payload = {
      questionName: questionName.trim(),
      questionText: questionText.trim(),
      answerText: answerText.trim(),
      expectedOutcome: expectedOutcome.trim(),
      language,
      difficulty,
    };

    if (!payload.questionName || !payload.questionText || !payload.answerText) {
      setStatusMessage("Please fill question name, question text and answer.");
      return;
    }

    setBusy(true);
    setStatusMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await readResponseData(response);
      if (!response.ok) throw new Error(data?.message || "Failed to add question");

      resetForm();
      setExpandedItems({});
      setStatusMessage("Question added.");
      await loadQuestions();
      setShowAddForm(false);
    } catch (error) {
      setStatusMessage(error.message || "Failed to add question.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id || busy) return;

    setBusy(true);
    setStatusMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await readResponseData(response);
      if (!response.ok) throw new Error(data?.message || "Failed to delete question");
      setStatusMessage("Question removed.");
      await loadQuestions();
    } catch (error) {
      setStatusMessage(error.message || "Failed to delete question.");
    } finally {
      setBusy(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
      <div style={{ maxWidth: "1020px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
            gap: "0.7rem",
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>Admin Question Manager</h1>
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            style={{
              border: "none",
              borderRadius: "6px",
              padding: "0.5rem 0.9rem",
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
            }}
          >
            {showAddForm ? "Hide Add Panel" : "Add New Question"}
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleAddQuestion}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "10px",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1.1rem" }}>
              Add Question (IDE View)
            </h2>

            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
              <div style={{ flex: "1 1 290px" }}>
                <label style={{ display: "block", marginBottom: "0.4rem", color: "#cbd5e1" }}>
                  Question Name
                </label>
                <input
                  value={questionName}
                  onChange={(event) => setQuestionName(event.target.value)}
                  placeholder="Enter question name"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#0f172a",
                    color: "#f1f5f9",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    padding: "0.65rem",
                  }}
                />
              </div>
              <div style={{ width: "200px", maxWidth: "100%" }}>
                <label style={{ display: "block", marginBottom: "0.4rem", color: "#cbd5e1" }}>
                  Language
                </label>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  style={{
                    width: "100%",
                    background: "#0f172a",
                    color: "#f1f5f9",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    padding: "0.55rem",
                  }}
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="c">C</option>
                  <option value="text">Text</option>
                </select>
              </div>
              <div style={{ width: "200px", maxWidth: "100%" }}>
                <label style={{ display: "block", marginBottom: "0.4rem", color: "#cbd5e1" }}>
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  style={{
                    width: "100%",
                    background: "#0f172a",
                    color: "#f1f5f9",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    padding: "0.55rem",
                  }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <label style={{ display: "block", marginBottom: "0.4rem", color: "#cbd5e1" }}>
              Question Text (IDE)
            </label>
            <div
              style={{
                border: "1px solid #334155",
                borderRadius: "8px",
                overflow: "hidden",
                marginBottom: "0.8rem",
              }}
            >
              <Editor
                height="220px"
                defaultLanguage={language === "text" ? "plaintext" : language}
                value={questionText}
                theme="vs-dark"
                onChange={(newValue = "") => setQuestionText(newValue)}
                options={{ minimap: { enabled: false }, fontSize: 14 }}
              />
            </div>

            <label style={{ display: "block", marginBottom: "0.4rem", color: "#cbd5e1" }}>
              Answer Text (IDE)
            </label>
            <div
              style={{
                border: "1px solid #334155",
                borderRadius: "8px",
                overflow: "hidden",
                marginBottom: "0.8rem",
              }}
            >
              <Editor
                height="180px"
                defaultLanguage={language === "text" ? "plaintext" : language}
                value={answerText}
                theme="vs-dark"
                onChange={(newValue = "") => setAnswerText(newValue)}
                options={{ minimap: { enabled: false }, fontSize: 14 }}
              />
            </div>

            <label style={{ display: "block", marginBottom: "0.4rem", color: "#cbd5e1" }}>
              Expected Outcome
            </label>
            <textarea
              value={expectedOutcome}
              onChange={(event) => setExpectedOutcome(event.target.value)}
              placeholder="e.g. Should print Area is: 78.5"
              rows={3}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#0f172a",
                color: "#f1f5f9",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "0.7rem",
                marginBottom: "0.8rem",
                resize: "vertical",
              }}
            />

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="submit"
                disabled={busy}
                style={{
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.55rem 1rem",
                  background: busy ? "#475569" : "#2563eb",
                  color: "white",
                  cursor: busy ? "not-allowed" : "pointer",
                }}
              >
                Add Question
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                style={{
                  border: "1px solid #475569",
                  borderRadius: "6px",
                  padding: "0.55rem 1rem",
                  background: "#1e293b",
                  color: "#f1f5f9",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "10px",
            padding: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.6rem",
              marginBottom: "0.75rem",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Saved Questions</h2>
            <button
              type="button"
              onClick={loadQuestions}
              disabled={loading || busy}
              style={{
                border: "none",
                borderRadius: "6px",
                padding: "0.45rem 0.8rem",
                background: loading || busy ? "#475569" : "#334155",
                color: "white",
                cursor: loading || busy ? "not-allowed" : "pointer",
              }}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p style={{ margin: 0, color: "#94a3b8" }}>Loading questions...</p>
          ) : questions.length === 0 ? (
            <p style={{ margin: 0, color: "#94a3b8" }}>No questions saved yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {questions.map((item, index) => {
                const itemId = item._id || `${item.questionName}-${index}`;
                const isExpanded = !!expandedItems[itemId];
                return (
                  <div
                    key={itemId}
                    style={{
                      background: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      padding: "0.7rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "0.6rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <button
                          type="button"
                          onClick={() => toggleExpand(itemId)}
                          style={{
                            border: "1px solid #475569",
                            borderRadius: "6px",
                            padding: "0.2rem 0.45rem",
                            background: "#1e293b",
                            color: "#f1f5f9",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                          }}
                        >
                          {isExpanded ? "Hide" : "Show"}
                        </button>
                        <strong>{item.questionName}</strong>
                      </div>

                      <span
                        style={{
                          fontSize: "0.8rem",
                          background: "#1e3a8a",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "999px",
                          marginRight: "0.4rem",
                        }}
                      >
                        {(item.difficulty || "").toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          background: "#334155",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "999px",
                        }}
                      >
                        {String(item.language || "text").toUpperCase()}
                      </span>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: "0.7rem" }}>
                        <p style={{ margin: "0 0 0.6rem", color: "#cbd5e1", whiteSpace: "pre-wrap" }}>
                          <strong>Expected Outcome:</strong>{" "}
                          {item.expectedOutcome || item.answerText || "..."}
                        </p>
                        <div
                          style={{
                            border: "1px solid #334155",
                            borderRadius: "8px",
                            overflow: "hidden",
                            marginBottom: "0.6rem",
                          }}
                        >
                          <Editor
                            height="180px"
                            defaultLanguage={
                              item.language && item.language !== "text"
                                ? item.language
                                : "plaintext"
                            }
                            value={item.questionText || ""}
                            theme="vs-dark"
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              fontSize: 14,
                            }}
                          />
                        </div>
                        <div
                          style={{
                            border: "1px solid #334155",
                            borderRadius: "8px",
                            overflow: "hidden",
                            marginBottom: "0.6rem",
                          }}
                        >
                          <Editor
                            height="160px"
                            defaultLanguage={
                              item.language && item.language !== "text"
                                ? item.language
                                : "plaintext"
                            }
                            value={item.answerText || ""}
                            theme="vs-dark"
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              fontSize: 14,
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          disabled={busy}
                          style={{
                            border: "none",
                            borderRadius: "6px",
                            padding: "0.4rem 0.75rem",
                            background: busy ? "#7f1d1d" : "#dc2626",
                            color: "white",
                            cursor: busy ? "not-allowed" : "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {statusMessage && <p style={{ marginTop: "1rem", color: "#93c5fd" }}>{statusMessage}</p>}
      </div>
    </div>
  );
}

export default AdminQuestionManager;
