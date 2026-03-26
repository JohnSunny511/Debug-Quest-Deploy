import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { countChanges } from '../utils/countCodeChanges';
import Editor from "@monaco-editor/react";
import { executeCode } from "../utils/executeCode";
import { recordLocalLeaderboardActivity, summarizeLeaderboardActivity, readLocalLeaderboardActivity } from "../utils/leaderboardActivity";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./Challenges.css";

function Challenges() {
    const [question, setQuestion] = useState(null);
    const loading = false;
    const [changeCount, setChangeCount] = useState(0);
    const originalCode = "";
    const [output, setOutput] = useState("");
    const [username, setUsername] = useState("");
    const [performanceScore, setPerformanceScore] = useState(() => {
        const stored = localStorage.getItem("debugQuestPerformanceScore");
        return stored ? parseInt(stored, 10) : 100;
    });
    const [performanceHistory, setPerformanceHistory] = useState(() => {
        const stored = localStorage.getItem("debugQuestPerformanceHistory");
        if (stored) {
            try { return JSON.parse(stored); } catch (e) {}
        }
        return [{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: "2-digit", second: "2-digit" }), score: 100 }];
    });
    const [leaderboardUsers, setLeaderboardUsers] = useState([]);
    const [solvedQuestions, setSolvedQuestions] = useState(() => {
        const stored = localStorage.getItem("debugQuestSolvedQuestions");
        return stored ? JSON.parse(stored) : [];
    });
    const [accuracyStats, setAccuracyStats] = useState(() => {
        const stored = localStorage.getItem("debugQuestAccuracyStats");
        return stored ? JSON.parse(stored) : { total: 0, correct: 0 };
    });
    const [currentRank, setCurrentRank] = useState("—");

    useEffect(() => {
        localStorage.setItem("debugQuestSolvedQuestions", JSON.stringify(solvedQuestions));
    }, [solvedQuestions]);

    useEffect(() => {
        localStorage.setItem("debugQuestAccuracyStats", JSON.stringify(accuracyStats));
    }, [accuracyStats]);

    useEffect(() => {
        localStorage.setItem("debugQuestPerformanceScore", performanceScore.toString());
        localStorage.setItem("debugQuestPerformanceHistory", JSON.stringify(performanceHistory));
    }, [performanceScore, performanceHistory]);

    useEffect(() => {
        let isMounted = true;
        const fetchLeaderboard = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`${API_BASE_URL}/api/leaderboard`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!isMounted) return;
                
                let usersList = [];
                if (Array.isArray(res.data)) usersList = res.data;
                else if (Array.isArray(res.data?.users)) usersList = res.data.users;
                
                usersList = usersList.filter(u => u && u.username);
                setLeaderboardUsers(usersList.slice(0, 5));
                
                const currentUserIndex = usersList.findIndex(u => u.username === username);
                if (currentUserIndex !== -1) {
                    setCurrentRank(currentUserIndex + 1);
                } else {
                    setCurrentRank("—");
                }
                const currentUser = usersList[currentUserIndex >= 0 ? currentUserIndex : -1];
                if (currentUser && typeof currentUser.points === 'number') {
                    setPerformanceScore(currentUser.points);
                    setPerformanceHistory(hist => {
                        const newHist = [...hist];
                        if (newHist.length === 1 && newHist[0].score === 100 && currentUser.points !== 100) {
                             return [{ time: newHist[0].time, score: currentUser.points }];
                        }
                        if (newHist.length > 0 && newHist[newHist.length - 1].score !== currentUser.points) {
                             newHist.push({ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: "2-digit", second: "2-digit" }), score: currentUser.points });
                             return newHist.slice(-9);
                        }
                        return newHist;
                    });
                }
            } catch (err) {
                console.error("Failed fetching leaderboard", err);
            }
        };
        if (username) fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 15000);
        return () => { isMounted = false; clearInterval(interval); };
    }, [username]);
    const motionDeckRef = useRef(null);
    const canvasRef = useRef(null);
    const mouseTarget = useRef({ x: 0.5, y: 0.5 });
    const mouseCurrent = useRef({ x: 0.5, y: 0.5 });

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
                headers: { Authorization: `Bearer ${token}` }
            });
            if (typeof res.data?.message === "string" && res.data.message.includes("Correct")) {
                recordLocalLeaderboardActivity();
                setAccuracyStats(prev => ({ total: prev.total + 1, correct: prev.correct + 1 }));
                setSolvedQuestions(prev => prev.includes(question._id) ? prev : [...prev, question._id]);
                setPerformanceScore(prev => prev + 10);
                setPerformanceHistory(hist => {
                    const lastScore = hist[hist.length - 1].score;
                    const newScore = lastScore + 10;
                    return [...hist.slice(-9), { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: "2-digit", second: "2-digit" }), score: newScore }];
                });
            } else {
                setAccuracyStats(prev => ({ total: prev.total + 1, correct: prev.correct }));
                setPerformanceScore(prev => Math.max(0, prev - 2));
                setPerformanceHistory(hist => {
                    const lastScore = hist[hist.length - 1].score;
                    const newScore = Math.max(0, lastScore - 2);
                    return [...hist.slice(-9), { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: "2-digit", second: "2-digit" }), score: newScore }];
                });
            }
            alert(res.data.message);
        } catch (_err) {
            alert("Submission failed.");
        }
    };

    const levels = [
        { name: "easy",   color: "#10b981", tasks: ["5 Questions", "Python/JS", "Basic Debugging"] },
        { name: "medium", color: "#f59e0b", tasks: ["5 Questions", "Python/JS", "Intermediate Debugging"] },
        { name: "hard",   color: "#ef4444", tasks: ["5 Questions", "Python/JS", "Advanced Debugging"] },
        { name: "ai", route: "/buggy",      tasks: ["AI Questions", "Python/JS/C", "Dynamic Bug Fixing"] },
    ];

    const handleDeckPointerMove = (e) => {
        const r = motionDeckRef.current.getBoundingClientRect();
        mouseTarget.current.x = (e.clientX - r.left) / r.width;
        mouseTarget.current.y = (e.clientY - r.top) / r.height;
    };

    const resetDeckPointer = () => {
        mouseTarget.current = { x: 0.5, y: 0.5 };
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let animId;
        let t = 0;
        let rotX = 0.3, rotY = 0;

        const lerp = (a, b, f) => a + (b - a) * f;

        function project(x, y, z, cx, cy, radius) {
            const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
            const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
            const y1 = y * cosX - z * sinX;
            const z1 = y * sinX + z * cosX;
            const x1 = x * cosY + z1 * sinY;
            const z2 = -x * sinY + z1 * cosY;
            const scale = radius / (radius + z2 * 0.5);
            return {
                px: cx + x1 * scale * radius,
                py: cy + y1 * scale * radius,
                z: z2,
                scale,
                visible: z2 > -0.05,
            };
        }

        const LANGUAGES = [
            { name: "Python",     color: [59, 188, 248],  icon: "🐍" },
            { name: "JavaScript", color: [247, 223, 30],  icon: "JS" },
            { name: "Java",       color: [232, 100, 60],  icon: "☕" },
            { name: "C++",        color: [0, 148, 255],   icon: "C++" },
            { name: "TypeScript", color: [49, 120, 198],  icon: "TS" },
            { name: "Rust",       color: [222, 99, 46],   icon: "⚙" },
            { name: "Go",         color: [0, 172, 215],   icon: "Go" },
            { name: "Kotlin",     color: [167, 97, 229],  icon: "K" },
        ];

        const RINGS = 5;
        const DOTS_PER_RING = 8;
        const dots = [];
        let langIndex = 0;
        for (let r = 0; r < RINGS; r++) {
            const lat = (r / (RINGS - 1)) * Math.PI - Math.PI / 2;
            const ringRadius = Math.cos(lat);
            const count = Math.max(1, Math.round(DOTS_PER_RING * ringRadius));
            for (let d = 0; d < count; d++) {
                const lon = (d / count) * Math.PI * 2;
                const lang = LANGUAGES[langIndex % LANGUAGES.length];
                langIndex++;
                dots.push({
                    x: Math.cos(lat) * Math.cos(lon),
                    y: Math.sin(lat),
                    z: Math.cos(lat) * Math.sin(lon),
                    lang,
                    baseSize: 4,
                });
            }
        }

        const lines = [];
        for (let m = 0; m < 8; m++) {
            const lon = (m / 8) * Math.PI * 2;
            const pts = [];
            for (let i = 0; i <= 48; i++) {
                const lat = (i / 48) * Math.PI - Math.PI / 2;
                pts.push({ x: Math.cos(lat) * Math.cos(lon), y: Math.sin(lat), z: Math.cos(lat) * Math.sin(lon) });
            }
            lines.push(pts);
        }
        for (let p = 0; p < 5; p++) {
            const lat = ((p + 1) / 6) * Math.PI - Math.PI / 2;
            const pts = [];
            for (let i = 0; i <= 64; i++) {
                const lon = (i / 64) * Math.PI * 2;
                pts.push({ x: Math.cos(lat) * Math.cos(lon), y: Math.sin(lat), z: Math.cos(lat) * Math.sin(lon) });
            }
            lines.push(pts);
        }

        function draw() {
            t += 0.004;
            const mc = mouseCurrent.current;
            const mt = mouseTarget.current;
            mc.x = lerp(mc.x, mt.x, 0.03);
            mc.y = lerp(mc.y, mt.y, 0.03);

            rotY = lerp(rotY, t + (mc.x - 0.5) * 1.4, 0.018);
            rotX = lerp(rotX, 0.3 + (mc.y - 0.5) * 0.9, 0.018);

            const W = canvas.width = canvas.offsetWidth;
            const H = canvas.height = canvas.offsetHeight;
            ctx.clearRect(0, 0, W, H);

            const cx = W / 2;
            const cy = H / 2;
            const radius = Math.min(W, H) * 0.42;

            lines.forEach(pts => {
                ctx.beginPath();
                pts.forEach((p, i) => {
                    const proj = project(p.x, p.y, p.z, cx, cy, radius);
                    i === 0 ? ctx.moveTo(proj.px, proj.py) : ctx.lineTo(proj.px, proj.py);
                });
                ctx.strokeStyle = `rgba(139,92,246,0.18)`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            });

            const projected = dots
                .map(d => ({ ...d, ...project(d.x, d.y, d.z, cx, cy, radius) }))
                .sort((a, b) => a.z - b.z);

            projected.forEach(d => {
                if (!d.visible) return;
                const depth = (d.z + 1) / 2;
                const alpha = 0.15 + depth * 0.85;
                const size = d.baseSize * d.scale * (0.5 + depth * 0.9);
                const [r, g, b] = d.lang.color;

                ctx.beginPath();
                ctx.arc(d.px, d.py, size * 1.6, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.2})`;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(d.px, d.py, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx.fill();

                if (depth > 0.42) {
                    const la = Math.min(1, (depth - 0.42) * 1.8);
                    const fs = Math.round(9 + depth * 6);
                    ctx.font = `600 ${fs}px 'Segoe UI', monospace`;
                    ctx.fillStyle = `rgba(255,255,255,${la})`;
                    ctx.textAlign = "center";
                    ctx.fillText(d.lang.name, d.px, d.py - size - 7);
                    if (depth > 0.62) {
                        ctx.font = `500 ${Math.round(fs * 0.85)}px monospace`;
                        ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, (depth - 0.62) * 3)})`;
                        ctx.fillText(d.lang.icon, d.px, d.py + size + 14);
                    }
                }
            });

            const cs = 16 + Math.sin(t * 1.1) * 2.5;
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cs * 3);
            grad.addColorStop(0, "rgba(220,160,255,0.98)");
            grad.addColorStop(0.35, "rgba(139,92,246,0.55)");
            grad.addColorStop(1, "rgba(139,92,246,0)");
            ctx.beginPath();
            ctx.arc(cx, cy, cs * 3, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            animId = requestAnimationFrame(draw);
        }

        draw();
        return () => cancelAnimationFrame(animId);
    }, []);

    const activitySummary = summarizeLeaderboardActivity(readLocalLeaderboardActivity()).summary;
    const currentStreak = activitySummary.currentStreak;
    const accuracyRate = accuracyStats.total > 0 ? Math.round((accuracyStats.correct / accuracyStats.total) * 100) + "%" : "—";
    
    const statsLeft = [
        { label: "Questions Solved", value: solvedQuestions.length.toString(), icon: "✦", color: "#8b5cf6" },
        { label: "Current Streak",   value: `${currentStreak} days`, icon: "◈", color: "#10b981" },
        { label: "Accuracy Rate",    value: accuracyRate, icon: "◉", color: "#f59e0b" },
        { label: "Rank",             value: currentRank === "—" ? "—" : `#${currentRank}`, icon: "▲", color: "#3b82f6" },
    ];

    const topPlayersDisplay = leaderboardUsers.length > 0 ? leaderboardUsers.map((user, index) => ({
        rank: index + 1,
        name: user.username,
        score: user.points,
        badge: index === 0 ? "#f59e0b" : index === 1 ? "#9ca3af" : index === 2 ? "#b45309" : "#6366f1"
    })) : [
        { rank: 1, name: "Loading...", score: "-", badge: "#6366f1" }
    ];

    const langProgress = [
        { lang: "Python",     pct: 0, color: "#3bbcf8" },
        { lang: "JavaScript", pct: 0, color: "#f7df1e" },
        { lang: "Java",       pct: 0, color: "#e8643c" },
    ];

    const card = {
        background: "linear-gradient(145deg, #1f1f2e, #11111e)",
        borderRadius: "16px",
        padding: "12px 16px",
        border: "1px solid rgba(139,92,246,0.18)",
    };

    const sectionLabel = {
        fontSize: "0.68rem",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: "#8b5cf6",
        fontWeight: 700,
        margin: "0 0 14px",
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#1f2937", color: "white", padding: "clamp(16px, 4vw, 20px)", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "30px" }}>
                <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2rem)", fontWeight: "bold", margin: 0 }}>Debug Quest</h1>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "8px", width: "min(100%, 420px)" }}>
                    👋 <strong>{username}</strong>{" "}
                    <button onClick={() => navigate("/learn")} style={{ backgroundColor: "#0ea5e9", color: "white", padding: "6px 10px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" }}>Learn</button>
                    <button onClick={logout} style={{ backgroundColor: "#ef4444", color: "white", padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold" }}>Logout</button>
                </div>
            </div>

            {/* Level Cards */}
            <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap", marginBottom: "40px" }}>
                {levels.map((lvl) => (
                    <div
                        key={lvl.name}
                        onClick={() => navigate(lvl.route || `/${lvl.name}`)}
                        style={{
                            background: "linear-gradient(145deg, #1f1f2e, #11111e)",
                            borderRadius: "20px", padding: "25px",
                            width: "min(100%, 280px)", flex: "1 1 220px",
                            boxShadow: "0 8px 20px rgba(0,0,0,0.5), 0 0 15px rgba(139,92,246,0.4)",
                            display: "flex", flexDirection: "column", gap: "15px",
                            cursor: "pointer", transition: "transform 0.3s, box-shadow 0.3s",
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-8px)"; e.currentTarget.style.boxShadow = "0 12px 25px rgba(0,0,0,0.6), 0 0 25px rgba(139,92,246,0.6)"; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.5), 0 0 15px rgba(139,92,246,0.4)"; }}
                    >
                        <div style={{ color: "#fff", fontWeight: "bold", fontSize: "1.2rem" }}>{lvl.name.toUpperCase()}</div>
                        <div style={{ fontSize: "0.85rem", color: "#c4c4c4" }}>Complete {lvl.tasks.length} tasks</div>
                        <ul style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "0", listStyle: "none" }}>
                            {lvl.tasks.map((task, idx) => (
                                <li key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#fff", fontSize: "0.9rem" }}>
                                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "50%", background: "linear-gradient(45deg, #8b5cf6, #c084fc)", boxShadow: "0 0 5px rgba(139,92,246,0.7)", color: "#111" }}>✓</span>
                                    {task}
                                </li>
                            ))}
                        </ul>
                        <button
                            style={{ marginTop: "15px", padding: "10px 0", width: "100%", background: "linear-gradient(90deg, #8b5cf6, #c084fc)", border: "none", borderRadius: "50px", color: "#fff", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 15px rgba(139,92,246,0.5)", transition: "0.3s" }}
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
                <div style={{ backgroundColor: "#374151", padding: "clamp(16px, 4vw, 20px)", borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.3)", width: "100%", maxWidth: "960px", margin: "0 auto", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "10px" }}>
                        <h2 style={{ fontSize: "clamp(1.4rem, 4vw, 1.8rem)", fontWeight: "bold", margin: 0 }}>{question.title}</h2>
                    </div>
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
                        <button onClick={runCode} style={{ backgroundColor: "#10b981", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>▶️ Run Code</button>
                        <button onClick={submitCode} style={{ backgroundColor: "#3b82f6", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>💾 Submit</button>
                    </div>
                    <pre style={{ backgroundColor: "#1f2937", padding: "15px", borderRadius: "8px", marginTop: "15px", overflowX: "auto", color: "#f3f4f6" }}>
                        <strong>Output:</strong> {output}
                    </pre>
                    <p style={{ marginTop: "10px", color: "#d1d5db" }}><strong>Expected Output:</strong> {question.expected}</p>
                    <p style={{ color: "#d1d5db" }}><strong>Changes Made:</strong> {changeCount}</p>
                </div>
            )}

            {/* ── Globe + Panels ──
                .globe-arena stays 100% wide with its fixed height (520px from CSS).
                The side panels are position:absolute, floating over the globe's blank edges.
                The globe canvas fills the full width as before — nothing changes its sizing.
            */}
            <div style={{ position: "relative", marginTop: "40px" }}>

                {/* Globe — unchanged, full width */}
                <div
                    ref={motionDeckRef}
                    className="globe-arena"
                    onMouseMove={handleDeckPointerMove}
                    onMouseLeave={resetDeckPointer}
                >
                    <canvas ref={canvasRef} className="globe-canvas" />
                </div>

                {/* LEFT PANEL — floats over globe left region */}
                <div className="globe-side-panel globe-side-panel--left">
                    <div style={card}>
                        <p style={sectionLabel}>Your Stats</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
                            {statsLeft.map((s) => (
                                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={{
                                        width: "36px", height: "36px", borderRadius: "10px",
                                        background: `${s.color}1a`,
                                        border: `1px solid ${s.color}40`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "15px", color: s.color, flexShrink: 0,
                                    }}>{s.icon}</span>
                                    <div>
                                        <div style={{ fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.3 }}>{s.label}</div>
                                        <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#f3f4f6" }}>{s.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={card}>
                        <p style={sectionLabel}>Languages</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
                            {langProgress.map((l) => (
                                <div key={l.lang}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#d1d5db", marginBottom: "5px" }}>
                                        <span>{l.lang}</span>
                                        <span style={{ color: l.color, fontWeight: 600 }}>{l.pct}%</span>
                                    </div>
                                    <div style={{ height: "6px", borderRadius: "4px", background: "rgba(255,255,255,0.07)" }}>
                                        <div style={{
                                            height: "100%",
                                            width: `${l.pct}%`,
                                            borderRadius: "4px",
                                            background: l.color,
                                            transition: "width 0.6s ease",
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL — floats over globe right region */}
                <div className="globe-side-panel globe-side-panel--right" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    
                    <div style={{...card, display: "flex", flexDirection: "column"}}>
                        <p style={sectionLabel}>Performance Trend</p>
                        <div style={{ width: "100%", height: "160px", marginTop: "10px", position: "relative" }}>
                            <ResponsiveContainer width="100%" height={160}>
                                <LineChart data={performanceHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="time" stroke="#6b7280" fontSize={11} tickMargin={8} />
                                    <YAxis stroke="#6b7280" fontSize={11} domain={['auto', 'auto']} tickFormatter={(val) => Math.round(val)} width={40} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "8px", color: "#f3f4f6" }}
                                        itemStyle={{ color: "#a855f7" }}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: "#a855f7", strokeWidth: 2, stroke: "#1f2937" }} activeDot={{ r: 6, fill: "#c084fc" }} animationDuration={1000} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ marginTop: "10px", textAlign: "center" }}>
                            <div style={{ fontSize: "0.80rem", color: "#9ca3af" }}>Current Score</div>
                            <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#c084fc", textShadow: "0 0 10px rgba(192,132,252,0.4)" }}>{performanceScore}</div>
                        </div>
                    </div>

                    <div style={card}>
                        <p style={sectionLabel}>Top Players</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {topPlayersDisplay.map((p, pIdx) => (
                                <div key={pIdx} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <span style={{
                                        width: "24px", height: "24px", borderRadius: "50%",
                                        background: p.rank <= 3 ? p.badge : "rgba(255,255,255,0.07)",
                                        border: p.rank <= 3 ? "none" : "1px solid rgba(255,255,255,0.12)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "0.65rem", fontWeight: "bold",
                                        color: p.rank <= 3 ? "#111" : "#6b7280",
                                        flexShrink: 0,
                                    }}>{p.rank}</span>
                                    <span style={{ flex: 1, fontSize: "0.80rem", color: "#e5e7eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                                    <span style={{ fontSize: "0.80rem", color: "#a78bfa", fontWeight: 700 }}>{p.score}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => navigate("/leaderboard")}
                            style={{
                                marginTop: "12px", width: "100%", padding: "6px 0",
                                background: "rgba(139,92,246,0.1)",
                                border: "1px solid rgba(139,92,246,0.3)",
                                borderRadius: "8px", color: "#c084fc",
                                fontSize: "0.75rem", cursor: "pointer", fontWeight: 600,
                                transition: "background 0.2s",
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = "rgba(139,92,246,0.22)"}
                            onMouseOut={(e) => e.currentTarget.style.background = "rgba(139,92,246,0.1)"}
                        >
                            Full Leaderboard
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Challenges;