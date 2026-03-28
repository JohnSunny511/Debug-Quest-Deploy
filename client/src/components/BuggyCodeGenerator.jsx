import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { calculateChangePercentage, countChanges } from "../utils/countCodeChanges";
import { executeCode } from "../utils/executeCode";
import { API_BASE_URL } from "../config/api";
import { redirectToLogin } from "../utils/authSession";
import UserTopNav from "./UserTopNav";
import { recordLocalLeaderboardActivity } from "../utils/leaderboardActivity";
import { applySubmissionProgress } from "../utils/performanceProgress";

const AI_API_URL = `${API_BASE_URL}/api/ai/generate`;
const AI_SUBMIT_URL = `${API_BASE_URL}/api/ai/submit`;

export default function BuggyCodeGenerator() {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [changeCount, setChangeCount] = useState(0);
  const [changePercentage, setChangePercentage] = useState(0);
  const [originalCode, setOriginalCode] = useState("");
  const [output, setOutput] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [revealedHints, setRevealedHints] = useState([]);
  const [areHintsVisible, setAreHintsVisible] = useState(false);

  const [aiLanguage, setAiLanguage] = useState("python");
  const [aiTopic, setAiTopic] = useState("");

  async function generateAIQuestion() {
    setQuestion(null);
    setOutput("");
    setChangeCount(0);
    setChangePercentage(0);
    setSubmissionStatus("");
    setRevealedHints([]);
    setAreHintsVisible(false);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(AI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ language: aiLanguage, topic: aiTopic }),
      });

      if (!res.ok) throw new Error("Failed to generate AI question");

      const data = await res.json();

      setQuestion({
        source: "AI",
        title: data.title || "AI Bug Fix Challenge",
        description: data.description || "",
        language: data.language,
        topic: data.topic,
        code: data.buggyCode,
        correctCode: data.correctCode,
        expectedOutput: data.expectedOutput || "",
        hints: Array.isArray(data.hints) ? data.hints : [],
        maxChangePercentage:
          typeof data.maxChangePercentage === "number" ? data.maxChangePercentage : null,
      });

      setOriginalCode(data.buggyCode);
    } catch (error) {
      setSubmissionStatus("❌ Failed to generate AI question");
    } finally {
      setLoading(false);
    }
  }

  const runCode = async () => {
    if (!question?.code?.trim()) {
      setOutput("No code to run.");
      return;
    }
    try {
      const result = await executeCode(question.language, question.code); // ✅ dynamic
      setOutput(result);
    } catch (error) {
      if (String(error?.message || "").includes("Session expired")) {
        redirectToLogin();
        return;
      }
      setOutput(error?.message || "Failed to execute code.");
    }
  };

  async function handleSubmit() {
    if (!question) {
      setSubmissionStatus("Please generate a question first.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(AI_SUBMIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          language: question.language,
          originalCode,
          submittedCode: question.code,
          expectedOutput: question.expectedOutput,
          maxChangePercentage: question.maxChangePercentage,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Submission failed.");
      }

      if (typeof data?.actualOutput === "string") {
        setOutput(data.actualOutput);
      }

      setSubmissionStatus(data?.message || "Submission complete.");

      if (data?.isCorrect === true) {
        recordLocalLeaderboardActivity();
      }

      applySubmissionProgress(localStorage.getItem("username") || "", {
        pointsDelta: Number(data?.pointsDelta || 0),
        isCorrect: data?.isCorrect === true,
      });
    } catch (error) {
      if (String(error?.message || "").includes("401") || String(error?.message || "").includes("403")) {
        redirectToLogin();
        return;
      }
      setSubmissionStatus(error?.message || "Submission failed.");
    }
  }

  const liveThreshold =
    typeof question?.maxChangePercentage === "number" ? question.maxChangePercentage : null;
  const isWithinThreshold = liveThreshold === null || changePercentage <= liveThreshold;
  const availableHints = Array.isArray(question?.hints) ? question.hints.filter(Boolean) : [];


  return (
  <div style={{
    minHeight: "100vh",
    background: "#0f172a",
    color: "#f1f5f9",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "2rem",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  }}>
    <UserTopNav
      breadcrumbItems={[
        { label: "Challenges", path: "/challenges" },
        { label: "AI Challenge" },
      ]}
    />

    <h1 style={{
      fontSize: "2.5rem",
      fontWeight: "bold",
      marginBottom: "2rem",
      color: "#f8fafc"
    }}>
      AI Bug Fix Challenge
    </h1>

    {/* CONTROL PANEL */}
    <div style={{
      width: "100%",
      maxWidth: "900px",
      backgroundColor: "#1e293b",
      padding: "1.5rem",
      borderRadius: "0.6rem",
      boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
      marginBottom: "1.5rem"
    }}>

      <h3 style={{ marginBottom: "1rem" }}>Generate Buggy Code</h3>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>

        <select
          value={aiLanguage}
          onChange={(e) => setAiLanguage(e.target.value)}
          style={{
            background: "#0f172a",
            color: "#f1f5f9",
            border: "1px solid #334155",
            padding: "8px",
            borderRadius: "6px"
          }}
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="c">C</option>
        </select>

        <input
          type="text"
          value={aiTopic}
          onChange={(e) => setAiTopic(e.target.value)}
          placeholder="e.g. array sorting"
          style={{
            flex: 1,
            background: "#0f172a",
            color: "#f1f5f9",
            border: "1px solid #334155",
            padding: "8px",
            borderRadius: "6px"
          }}
        />

        <button
          onClick={generateAIQuestion}
          style={{
            background: "#3b82f6",
            border: "none",
            padding: "8px 14px",
            borderRadius: "6px",
            color: "white",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          🤖 Generate
        </button>
      </div>
    </div>

    {loading && (
      <p style={{ color: "#94a3b8" }}>Generating question...</p>
    )}

    {/* QUESTION PANEL */}
    {question && (
      <div style={{
        width: "100%",
        maxWidth: "900px",
        backgroundColor: "#1e293b",
        padding: "1.5rem",
        borderRadius: "0.6rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.35)"
      }}>

        <h2 style={{ marginBottom: "10px" }}>{question.title || question.topic}</h2>
        <p style={{ color: "#94a3b8", marginBottom: "12px" }}>
          Language: {question.language}
        </p>
        <div style={{
          background: "#111827",
          border: "1px solid #334155",
          borderRadius: "10px",
          padding: "12px",
          marginBottom: "15px",
          color: "#cbd5e1",
          whiteSpace: "pre-wrap",
          lineHeight: 1.6
        }}>
          <p style={{ margin: "0 0 8px", color: "#f8fafc", fontWeight: "700" }}>
            Question Description
          </p>
          {question.description || `Fix the generated ${question.language} code for ${question.topic}.`}
        </div>

        <div style={{
          border: "1px solid #334155",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "15px"
        }}>
          <Editor
            height="350px"
            defaultLanguage={question.language?.toLowerCase() || "python"}
            value={question.code}
            theme="vs-dark"
            onChange={(newValue = "") => {
              const changeNum = countChanges(originalCode, newValue, question.language);
              const nextChangeCount = changeNum < 0 ? 0 : changeNum;
              const nextChangePercentage = calculateChangePercentage(originalCode, newValue, question.language);
              setChangeCount(nextChangeCount);
              setChangePercentage(nextChangePercentage < 0 ? 0 : nextChangePercentage);
              setQuestion((prev) => ({ ...prev, code: newValue }));
            }}
          />
        </div>

        {/* BUTTONS */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={handleSubmit}
            style={{
              background: "#22c55e",
              border: "none",
              padding: "8px 14px",
              borderRadius: "6px",
              color: "white",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Submit
          </button>

          <button
            onClick={runCode}
            style={{
              background: "#3b82f6",
              border: "none",
              padding: "8px 14px",
              borderRadius: "6px",
              color: "white",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            ▶ Run Code
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
                background: "#f59e0b",
                border: "none",
                padding: "8px 14px",
                borderRadius: "6px",
                color: "#111827",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {areHintsVisible ? "Hide Hints" : "Hint"}
            </button>
          )}

          {submissionStatus && (
            <span style={{ marginLeft: "10px", fontWeight: "600" }}>
              {submissionStatus}
            </span>
          )}
        </div>

        {availableHints.length > 0 && areHintsVisible && (
          <div style={{
            marginTop: "16px",
            background: "#111827",
            border: "1px solid #334155",
            borderRadius: "10px",
            padding: "12px",
            color: "#cbd5e1"
          }}>
            <p style={{ margin: "0 0 10px", color: "#f8fafc", fontWeight: "700" }}>
              Available Hints
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: revealedHints.length ? "10px" : 0 }}>
              {availableHints.map((_, index) => {
                const isRevealed = revealedHints.includes(index);
                return (
                  <button
                    key={`ai-hint-${index}`}
                    type="button"
                    onClick={() => {
                      if (!isRevealed) {
                        setRevealedHints((prev) => [...prev, index].sort((left, right) => left - right));
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
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {revealedHints.map((hintIndex) => (
                <div
                  key={`ai-hint-text-${hintIndex}`}
                  style={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ color: "#f8fafc" }}>{`Hint ${hintIndex + 1}: `}</strong>
                  {availableHints[hintIndex]}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OUTPUT */}
        <div style={{
          marginTop: "18px",
          background: "#020617",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #334155",
          color: "#e2e8f0",
          whiteSpace: "pre-wrap"
        }}>
          <strong>Output:</strong>
          <br />
          {output || "Run the code to see output"}
        </div>

        <div style={{
          marginTop: "12px",
          background: "#111827",
          border: `1px solid ${isWithinThreshold ? "#14532d" : "#7f1d1d"}`,
          borderRadius: "10px",
          padding: "12px",
          color: "#94a3b8"
        }}>
          <p style={{ margin: "0 0 8px", color: "#f8fafc", fontWeight: "700" }}>
            Live Change Tracking
          </p>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <span>Change units: <strong style={{ color: "#f8fafc" }}>{changeCount}</strong></span>
            <span>Change %: <strong style={{ color: "#f8fafc" }}>{changePercentage}%</strong></span>
            <span>Allowed %: <strong style={{ color: "#f8fafc" }}>{liveThreshold === null ? "No limit" : `${liveThreshold}%`}</strong></span>
            <span style={{ color: isWithinThreshold ? "#86efac" : "#fca5a5", fontWeight: "bold" }}>
              {isWithinThreshold ? "Within limit" : "Above limit"}
            </span>
          </div>
        </div>

        <div style={{
          marginTop: "12px",
          background: "#111827",
          border: "1px solid #334155",
          borderRadius: "10px",
          padding: "12px",
          color: "#cbd5e1"
        }}>
          <p style={{ margin: "0 0 8px", color: "#f8fafc", fontWeight: "700" }}>
            Expected Output
          </p>
          <div style={{ whiteSpace: "pre-wrap" }}>
            {question.expectedOutput || "No expected output provided."}
          </div>
        </div>
      </div>
    )}
  </div>
);
}
