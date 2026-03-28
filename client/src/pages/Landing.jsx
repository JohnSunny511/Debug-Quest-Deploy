import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearStoredSession, validateStoredSession } from "../utils/authSession";
import "./Landing.css";

function Landing() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [username, setUsername] = useState(() => localStorage.getItem("username"));

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const hasToken = localStorage.getItem("token");
      if (!hasToken) {
        if (!isMounted) return;
        setToken("");
        setUsername("");
        return;
      }

      try {
        const isValid = await validateStoredSession();
        if (!isMounted) return;

        if (isValid) {
          setToken(localStorage.getItem("token") || "");
          setUsername(localStorage.getItem("username") || "");
          return;
        }

        setToken("");
        setUsername("");
      } catch (_error) {
        if (!isMounted) return;
        setToken(localStorage.getItem("token") || "");
        setUsername(localStorage.getItem("username") || "");
      }
    };

    syncSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="landing-page">
      <div className="landing-ambient" aria-hidden="true">
        <span className="ambient-orb orb-a" />
        <span className="ambient-orb orb-b" />
        <span className="ambient-orb orb-c" />
      </div>

      <header className="landing-header">
        <div className="landing-brand">
          <span className="brand-mark">&lt;/&gt;</span>
          <span className="brand-name">Debug Quest</span>
        </div>

        <div className="landing-nav">
          <Link className="nav-link" to="/learn">
            Learn Debugging
          </Link>
          {token ? (
            <>
              <span className="welcome-copy">
                Welcome{username ? `, ${username}` : ""}
              </span>
              <button
                type="button"
                className="nav-cta"
                onClick={() => navigate("/challenges")}
              >
                Open Challenges
              </button>
              <button
                type="button"
                className="nav-cta"
                style={{ backgroundColor: "#ef4444", border: "none", marginLeft: "10px" }}
                onClick={() => {
                  clearStoredSession();
                  window.location.href = "/login";
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="nav-link" to="/login">
                Login
              </Link>
              <Link className="nav-cta" to="/signup">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-copy">
          <p className="hero-eyebrow">Interactive Debugging Arena</p>
          <h1 className="hero-title">
            <span className="hero-title-line hero-title-line-1">
              Level up your debugging
            </span>
            <span className="hero-title-line hero-title-line-2">
              instincts with real coding battles.
            </span>
          </h1>
          <p className="hero-description">
            Debug Quest gives you structured challenge tracks, AI-generated bug
            hunts, live scoring logic, and competitive progress tracking so you
            can practice debugging in a way that feels closer to real
            engineering work.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="hero-primary"
              onClick={() => navigate(token ? "/challenges" : "/login")}
            >
              {token ? "Continue Challenge" : "Start Debugging"}
            </button>
            <button
              type="button"
              className="hero-secondary"
              onClick={() => navigate("/learn")}
            >
              Learn Concepts
            </button>
            <button
              type="button"
              className="hero-secondary"
              onClick={() => navigate("/leaderboard")}
            >
              View Leaderboard
            </button>
          </div>

          <div className="hero-metrics">
            <div className="metric-card">
              <strong>Adaptive</strong>
              <span>Challenge Tracks</span>
            </div>
            <div className="metric-card">
              <strong>AI</strong>
              <span>Dynamic Bug Scenarios</span>
            </div>
            <div className="metric-card">
              <strong>Multiple</strong>
              <span>Supported Languages</span>
            </div>
          </div>

          <div className="hero-support-strip">
            <div className="support-chip">Live change tracking</div>
            <div className="support-chip">Hints and guided debugging</div>
            <div className="support-chip">Per-question discussions</div>
            <div className="support-chip">Leaderboard momentum</div>
          </div>
        </section>

        <section className="hero-visual" aria-hidden="true">
          <div className="terminal-card">
            <div className="terminal-head">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
              <span className="terminal-title">debug-session.js</span>
            </div>

            <div className="terminal-body">
              <div className="code-line line-1">const score = bugsFixed * speed;</div>
              <div className="code-line line-2">if (tests.pass()) submit(score);</div>
              <div className="code-line line-3">leaderboard.update(playerId);</div>
              <div className="typing-line">run debug-quest --mode ranked</div>
            </div>
          </div>

          <div className="floating-pill pill-1">Easy to Hard Tracks</div>
          <div className="floating-pill pill-2">Realtime Feedback</div>
          <div className="floating-pill pill-3">Code Like Production</div>
        </section>
      </main>

      <section className="feature-strip">
        <article className="feature-card">
          <h3>Progressive Difficulty</h3>
          <p>Start with syntax-level issues and move to logic-heavy breakpoints.</p>
        </article>
        <article className="feature-card">
          <h3>AI Bug Generator</h3>
          <p>Train on fresh bug patterns so you do not memorize one fixed answer.</p>
        </article>
        <article className="feature-card">
          <h3>Competitive Tracking</h3>
          <p>Stay motivated with rankings and improvement milestones per attempt.</p>
        </article>
      </section>

      <section className="workflow-strip">
        <article className="workflow-card">
          <p className="workflow-step">01</p>
          <h3>Pick Your Arena</h3>
          <p>Move through guided difficulty tracks or generate a fresh AI challenge when you want something unpredictable.</p>
        </article>
        <article className="workflow-card">
          <p className="workflow-step">02</p>
          <h3>Debug With Feedback</h3>
          <p>Run code, inspect output, watch live change limits, and use hints only when you need a nudge.</p>
        </article>
        <article className="workflow-card">
          <p className="workflow-step">03</p>
          <h3>Improve In Public</h3>
          <p>Track progress over time, compare with the leaderboard, and learn from question-specific discussion threads.</p>
        </article>
      </section>
    </div>
  );
}

export default Landing;
