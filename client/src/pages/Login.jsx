import React, { useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import "./Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const completeLogin = (data, fallbackUsername = username) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username || fallbackUsername);
    if (data.role) {
      localStorage.setItem("role", data.role);
    }
    navigate(data.redirectTo || "/challenges");
  };

  const handleTraditionalLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Enter both your username and password to continue.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username: username.trim(),
        password,
      });

      completeLogin(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid credentials.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const res = await axios.post(`${API_BASE_URL}/api/auth/google-login`, {
        token: credentialResponse.credential,
      });

      completeLogin(res.data, res.data.username);
    } catch (err) {
      const msg = err.response?.data?.message || "Google login failed.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-ambient" aria-hidden="true">
        <span className="login-orb login-orb-a" />
        <span className="login-orb login-orb-b" />
        <span className="login-grid" />
      </div>

      <header className="login-header">
        <Link className="login-brand" to="/">
          <span className="login-brand-mark">&lt;/&gt;</span>
          <span className="login-brand-name">Debug Quest</span>
        </Link>

        <nav className="login-nav">
          <Link className="login-nav-link" to="/learn">
            Learn
          </Link>
          <Link className="login-nav-link" to="/leaderboard">
            Leaderboard
          </Link>
          <Link className="login-nav-cta" to="/signup">
            Create Account
          </Link>
        </nav>
      </header>

      <main className="login-shell">
        <section className="login-copy">
          <p className="login-eyebrow">Welcome Back</p>
          <h1>Pick up your next debugging run with a cleaner, faster sign-in flow.</h1>
          <p className="login-description">
            Access your challenge history, continue ranked practice, and keep
            climbing the leaderboard with one secure login.
          </p>

          <div className="login-highlights">
            <div className="login-highlight-card">
              <strong>Live Progress</strong>
              <span>Continue from where you left off across challenge levels.</span>
            </div>
            <div className="login-highlight-card">
              <strong>Competitive Practice</strong>
              <span>Track your pace against other developers in the arena.</span>
            </div>
            <div className="login-highlight-card">
              <strong>Multiple Sign-in Options</strong>
              <span>Use your account credentials or sign in with Google.</span>
            </div>
          </div>
        </section>

        <section className="login-panel-wrapper">
          <div className="login-panel">
            <div className="login-panel-header">
              <p className="login-panel-kicker">Account Access</p>
              <h2>Sign in to Debug Quest</h2>
              <p>Use your existing account to jump straight into challenges.</p>
            </div>

            <form
              className="login-form"
              onSubmit={(event) => {
                event.preventDefault();
                handleTraditionalLogin();
              }}
            >
              <label className="login-field">
                <span>Username</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  disabled={isSubmitting}
                />
              </label>

              <label className="login-field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
              </label>

              {errorMessage ? (
                <div className="login-error" role="alert">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                className="login-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing In..." : "Login to Continue"}
              </button>
            </form>

            <div className="login-divider">
              <span>or continue with</span>
            </div>

            <div className="login-google-wrap">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => setErrorMessage("Google login failed. Please try again.")}
              />
            </div>

            <p className="login-footer-copy">
              New to Debug Quest? <Link to="/signup">Create your account</Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Login;
