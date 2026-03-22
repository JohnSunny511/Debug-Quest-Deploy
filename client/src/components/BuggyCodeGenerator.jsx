import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { countChanges } from "../utils/countCodeChanges";
import { executeCode } from "../utils/executeCode";
import { API_BASE_URL } from "../config/api";

const AI_API_URL = `${API_BASE_URL}/api/ai/generate`;

export default function BuggyCodeGenerator() {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [changeCount, setChangeCount] = useState(0);
  const [originalCode, setOriginalCode] = useState("");
  const [output, setOutput] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState("");

  const [aiLanguage, setAiLanguage] = useState("python");
  const [aiTopic, setAiTopic] = useState("");

  async function generateAIQuestion() {
    setQuestion(null);
    setOutput("");
    setChangeCount(0);
    setSubmissionStatus("");
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
        language: data.language,
        topic: data.topic,
        code: data.buggyCode,
        correctCode: data.correctCode,
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
    const result = await executeCode(question.language, question.code); // ✅ dynamic
    setOutput(result);
  };


  function normalizeCode(code) {
    if (!code) return "";
    return code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "").replace(/\s+/g, "").trim();
  }

  async function handleSubmit() {
  if (!question) {
    setSubmissionStatus("Please generate a question first.");
    return;
  }

  const userCode = normalizeCode(question.code);
  const correctCode = normalizeCode(question.correctCode || "");

  if (!correctCode) {
    setSubmissionStatus("⚠️ No correct code available to check against.");
    return;
  }

  if (userCode === correctCode) {
    setSubmissionStatus("✅ Correct!");
  } else {
    setSubmissionStatus("❌ Incorrect! Keep trying.");
  }
}


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

        <h2 style={{ marginBottom: "10px" }}>{question.topic}</h2>
        <p style={{ color: "#94a3b8", marginBottom: "12px" }}>
          Language: {question.language}
        </p>

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
              setChangeCount(changeNum);
              setQuestion((prev) => ({ ...prev, code: newValue }));
            }}
          />
        </div>

        {/* BUTTONS */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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

          {submissionStatus && (
            <span style={{ marginLeft: "10px", fontWeight: "600" }}>
              {submissionStatus}
            </span>
          )}
        </div>

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

        <p style={{ marginTop: "12px", color: "#94a3b8" }}>
          Changes made: <strong>{changeCount}</strong>
        </p>
      </div>
    )}
  </div>
);
}
