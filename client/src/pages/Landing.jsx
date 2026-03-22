import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Landing.css";

function Landing() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

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
          <h1>Level up your debugging instincts with real coding battles.</h1>
          <p className="hero-description">
            Debug Quest gives you curated easy-medium-hard challenges, AI-driven
            bug hunts, and a live leaderboard so you can practice like a real
            engineer.
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
              <strong>15+</strong>
              <span>Core Challenges</span>
            </div>
            <div className="metric-card">
              <strong>AI</strong>
              <span>Dynamic Bug Scenarios</span>
            </div>
            <div className="metric-card">
              <strong>2</strong>
              <span>Supported Languages</span>
            </div>
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
    </div>
  );
}

export default Landing;
