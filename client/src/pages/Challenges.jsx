import React, { useEffect, useState } from "react";
import axios from "axios";
import { countChanges } from '../utils/countCodeChanges';
import Editor from "@monaco-editor/react";
import { executeCode } from "../utils/executeCode";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

function Challenges() {
    const [question, setQuestion] = useState(null);
    const loading = false;
    const [changeCount, setChangeCount] = useState(0);
    const originalCode = "";
    const [output, setOutput] = useState("");
    const [username, setUsername] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const storedUsername = localStorage.getItem("username");
        if (storedUsername) setUsername(storedUsername);
    }, []);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        window.location.href = "/login";
    };

    const runCode = async () => {
        if (!question?.code?.trim()) {
            setOutput("No code to run.");
            return;
        }

        try {
            const result = await executeCode(question.language, question.code);
            setOutput(result);
        } catch (_err) {
            setOutput("❌ Error running code.");
        }
    };

    const submitCode = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await axios.post(`${API_BASE_URL}/api/questions/submit`, {
                id: question.id,
                code: question.code,
                level: question.level,
                questionId: question._id,
                language: question.language
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            alert(res.data.message);
        } catch (_err) {
            alert("Submission failed.");
        }
    };

    const levels = [
        { name: "easy", color: "#10b981", icon: "🟢", tasks: ["5 Questions", "Python/JS", "Basic Debugging"] },
        { name: "medium", color: "#f59e0b", icon: "🟡", tasks: ["5 Questions", "Python/JS", "Intermediate Debugging"] },
        { name: "hard", color: "#ef4444", icon: "🔴", tasks: ["5 Questions", "Python/JS", "Advanced Debugging"] },
        { name: "ai", route: "/buggy", tasks: ["AI Questions", "Python/JS/C", "Dynamic Bug Fixing"] },
    ];

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#1f2937", color: "white", padding: "clamp(16px, 4vw, 20px)", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "30px" }}>
                <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2rem)", fontWeight: "bold", margin: 0 }}> Debug Quest</h1>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "8px", width: "min(100%, 420px)" }}>
                    👋 <strong>{username}</strong>{" "}
                    <button
                        onClick={() => navigate("/leaderboard")}
                        style={{
                            backgroundColor: "#334155",
                            color: "white",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "0.85rem",
                        }}
                    >
                        Leaderboard
                    </button>
                    <button
                        onClick={() => navigate("/learn")}
                        style={{
                            backgroundColor: "#0ea5e9",
                            color: "white",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "0.85rem",
                        }}
                    >
                        Learn
                    </button>
                    <button
                        onClick={logout}
                        style={{ backgroundColor: "#ef4444", color: "white", padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold" }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Cards Section */}
            <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap", marginBottom: "40px" }}>
  {levels.map((lvl) => (
    <div
      key={lvl.name}
      onClick={() => navigate(lvl.route || `/${lvl.name}`)}
      style={{
        background: "linear-gradient(145deg, #1f1f2e, #11111e)",
        borderRadius: "20px",
        padding: "25px",
        width: "min(100%, 280px)",
        flex: "1 1 220px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.5), 0 0 15px rgba(139,92,246,0.4)",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        cursor: "pointer",
        transition: "transform 0.3s, box-shadow 0.3s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.boxShadow = "0 12px 25px rgba(0,0,0,0.6), 0 0 25px rgba(139,92,246,0.6)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.5), 0 0 15px rgba(139,92,246,0.4)";
      }}
    >
      <div style={{ color: "#fff", fontWeight: "bold", fontSize: "1.2rem" }}>{lvl.name.toUpperCase()}</div>
      <div style={{ fontSize: "0.85rem", color: "#c4c4c4" }}>Complete {lvl.tasks.length} tasks</div>

      <ul style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "0", listStyle: "none" }}>
        {lvl.tasks.map((task, idx) => (
          <li key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#fff", fontSize: "0.9rem" }}>
            <span style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "linear-gradient(45deg, #8b5cf6, #c084fc)",
              boxShadow: "0 0 5px rgba(139,92,246,0.7)",
              color: "#111"
            }}>✓</span>
            {task}
          </li>
        ))}
      </ul>

      <button style={{
        marginTop: "15px",
        padding: "10px 0",
        width: "100%",
        background: "linear-gradient(90deg, #8b5cf6, #c084fc)",
        border: "none",
        borderRadius: "50px",
        color: "#fff",
        fontWeight: "bold",
        cursor: "pointer",
        boxShadow: "0 4px 15px rgba(139,92,246,0.5)",
        transition: "0.3s"
      }}
      onMouseOver={(e) => e.currentTarget.style.boxShadow = "0 6px 20px rgba(139,92,246,0.7)"}
      onMouseOut={(e) => e.currentTarget.style.boxShadow = "0 4px 15px rgba(139,92,246,0.5)"}
      >
        {lvl.route ? "Open AI" : `Start ${lvl.name}`}
      </button>
    </div>
  ))}
</div>


            {loading && <p style={{ textAlign: "center", fontSize: "1.2rem", color: "#9ca3af" }}>Loading...</p>}

            {/* Question Section */}
            {question && (
                <div style={{ backgroundColor: "#374151", padding: "clamp(16px, 4vw, 20px)", borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.3)", width: "100%", maxWidth: "960px", margin: "0 auto" }}>
                    <h2 style={{ fontSize: "clamp(1.4rem, 4vw, 1.8rem)", fontWeight: "bold", marginBottom: "10px" }}>{question.title}</h2>
                    <p style={{ color: "#9ca3af", marginBottom: "15px" }}><strong>Language:</strong> {question.language}</p>

                    <Editor
                        height="300px"
                        defaultLanguage={question.language.toLowerCase()}
                        value={question.code}
                        theme="vs-dark"
                        onChange={(newValue) => {
                            const changeNum = countChanges(originalCode, newValue, question.language);
                            setChangeCount(changeNum);
                            setQuestion((prev) => ({ ...prev, code: newValue }));
                        }}
                        options={{ fontSize: 16, minimap: { enabled: false }, lineNumbers: "on", roundedSelection: true }}
                    />

                    <div style={{ display: "flex", gap: "15px", marginTop: "15px", flexWrap: "wrap" }}>
                        <button
                            onClick={runCode}
                            style={{ backgroundColor: "#10b981", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
                        >
                            ▶️ Run Code
                        </button>
                        <button
                            onClick={submitCode}
                            style={{ backgroundColor: "#3b82f6", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
                        >
                            💾 Submit
                        </button>
                    </div>

                    <pre style={{ backgroundColor: "#1f2937", padding: "15px", borderRadius: "8px", marginTop: "15px", overflowX: "auto", color: "#f3f4f6" }}>
                        <strong>Output:</strong> {output}
                    </pre>

                    <p style={{ marginTop: "10px", color: "#d1d5db" }}><strong>Expected Output:</strong> {question.expected}</p>
                    <p style={{ color: "#d1d5db" }}><strong>Changes Made:</strong> {changeCount}</p>
                </div>
            )}
        </div>
    );
}

export default Challenges;
