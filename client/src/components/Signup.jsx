import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import "./Signup.css";

function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const signup = async () => {
    if (!username.trim() || !password.trim()) {
      setSuccessMessage("");
      setErrorMessage("Choose a username and password to create your account.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const res = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        username: username.trim(),
        password,
      });

      setSuccessMessage(res.data.message || "Account created successfully.");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Signup failed.";
      setSuccessMessage("");
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-ambient" aria-hidden="true">
        <span className="signup-orb signup-orb-a" />
        <span className="signup-orb signup-orb-b" />
        <span className="signup-grid" />
      </div>

      <header className="signup-header">
        <Link className="signup-brand" to="/">
          <span className="signup-brand-mark">&lt;/&gt;</span>
          <span className="signup-brand-name">Debug Quest</span>
        </Link>

        <nav className="signup-nav">
          <Link className="signup-nav-link" to="/learn">
            Learn
          </Link>
          <Link className="signup-nav-link" to="/leaderboard">
            Leaderboard
          </Link>
          <Link className="signup-nav-cta" to="/login">
            Sign In
          </Link>
        </nav>
      </header>

      <main className="signup-shell">
        <section className="signup-copy">
          <p className="signup-eyebrow">Create Your Account</p>
          <h1>Start your debugging journey with a workspace built for practice and progress.</h1>
          <p className="signup-description">
            Join Debug Quest to unlock challenge tracks, monitor improvement,
            and build the instincts that make bug fixing feel fast and confident.
          </p>

          <div className="signup-highlights">
            <div className="signup-highlight-card">
              <strong>Structured Growth</strong>
              <span>Work through easy, medium, and hard debugging scenarios at your pace.</span>
            </div>
            <div className="signup-highlight-card">
              <strong>Sharpen Real Skills</strong>
              <span>Practice the kind of code reading and diagnosis used on real teams.</span>
            </div>
            <div className="signup-highlight-card">
              <strong>Track Every Win</strong>
              <span>Measure consistency, leaderboard movement, and progress over time.</span>
            </div>
          </div>
        </section>

        <section className="signup-panel-wrapper">
          <div className="signup-panel">
            <div className="signup-panel-header">
              <p className="signup-panel-kicker">New Member Setup</p>
              <h2>Create your Debug Quest account</h2>
              <p>Pick a username and password to unlock the full challenge experience.</p>
            </div>

            <form
              className="signup-form"
              onSubmit={(event) => {
                event.preventDefault();
                signup();
              }}
            >
              <label className="signup-field">
                <span>Username</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Choose a username"
                  autoComplete="username"
                  disabled={isSubmitting}
                />
              </label>

              <label className="signup-field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </label>

              {errorMessage ? (
                <div className="signup-error" role="alert">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="signup-success" role="status">
                  {successMessage}
                </div>
              ) : null}

              <button
                type="submit"
                className="signup-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="signup-footer-copy">
              Already have an account? <Link to="/login">Sign in here</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Signup;
