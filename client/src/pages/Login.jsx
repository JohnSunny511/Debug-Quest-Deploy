// src/pages/Login.jsx (Combined Authentication Page)

import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google"; // Import GoogleLogin
import { API_BASE_URL } from "../config/api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // ------------------------------------
  // 1. TRADITIONAL LOGIN LOGIC
  // ------------------------------------
  const handleTraditionalLogin = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username,
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username || username);
      navigate(res.data.redirectTo || "/challenges");
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid credentials";
      alert(msg);
    }
  };

  // ------------------------------------
  // 2. GOOGLE LOGIN LOGIC
  // ------------------------------------
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/google-login`, {
        token: credentialResponse.credential,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);
      navigate(res.data.redirectTo || "/challenges");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      alert(msg);
    }
  };

  // ------------------------------------
  // 3. STYLES (Consolidated)
  // ------------------------------------
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f4f4f4",
    fontFamily: "sans-serif",
    padding: "clamp(16px, 4vw, 24px)",
    boxSizing: "border-box",
  };

  const formStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: "clamp(1.25rem, 4vw, 2rem)",
    borderRadius: "8px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    width: "min(100%, 360px)",
  };

  const inputStyle = {
    padding: "0.8rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "1rem",
  };

  const buttonStyle = {
    padding: "0.8rem",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#007bff",
    color: "#fff",
    fontSize: "1rem",
    cursor: "pointer",
  };

  const linkStyle = {
    textAlign: "center",
    marginTop: "1rem",
    fontSize: "0.9rem",
  };
  
  const separatorStyle = {
      textAlign: 'center',
      margin: '1rem 0',
      color: '#aaa',
      fontSize: '0.9rem',
  };

  // ------------------------------------
  // 4. RENDER UI
  // ------------------------------------
  return (
    <div style={containerStyle}>
      <form style={formStyle} onSubmit={(e) => e.preventDefault()}>
        <h2 style={{ textAlign: "center" }}>Login</h2>
        
        {/* Traditional Form Inputs */}
        <input
          style={inputStyle}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          style={inputStyle}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button style={buttonStyle} onClick={handleTraditionalLogin}>
          Login
        </button>

        {/* Signup Link */}
        <div style={linkStyle}>
          Don't have an account? <Link to="/signup">Signup here</Link>
        </div>
        {/* Separator */}
        <div style={separatorStyle}>--- OR ---</div>

        {/* Google Login Button */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin onSuccess={handleGoogleLogin} onError={() => alert("Google login failed")} />
        </div>
        
      </form>
    </div>
  );
}

export default Login;

